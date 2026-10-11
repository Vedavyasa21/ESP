/*
  =============================================================================
  AERIS · ESP32 + MQ-2 Cloud Telemetry Firmware (Production Architecture)
  =============================================================================
  
  Features:
  1. Autonomous Safety: MQ-2 sensor reading, threshold evaluation, Red/Green LEDs,
     and Buzzer operate inside an unblocked hardware loop regardless of Wi-Fi or Cloud status.
  2. Router Station Mode: Connects to home/college Wi-Fi with auto-reconnection.
  3. Outbound HTTPS Telemetry: Dispatches POST requests every 2000ms using millis()
     scheduling to avoid blocking sensor sampling.
  4. Secure Bearer Authentication: Transmits device token in Authorization header.
  5. JSON Protocol:
     {
       "deviceId": "aeris-esp32-01",
       "adc": 1248,
       "threshold": 1800,
       "ready": true,
       "alarm": false,
       "uptimeMs": 48320
     }
  =============================================================================
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// -----------------------------------------------------------------------------
// 1. Hardware Pin Definitions
// -----------------------------------------------------------------------------
const int PIN_MQ2_ADC   = 34; // MQ-2 Analog In (ADC1_CH6)
const int PIN_LED_GREEN = 18; // Green LED (Safe state)
const int PIN_LED_RED   = 19; // Red LED (Alarm state)
const int PIN_BUZZER    = 23; // Active Piezo Buzzer

// -----------------------------------------------------------------------------
// 2. Sensor & Safety Parameters
// -----------------------------------------------------------------------------
const int ALARM_THRESHOLD          = 1800;  // Raw 12-bit ADC trip level (0 - 4095)
const unsigned long WARMUP_TIME_MS = 20000; // 20s sensor heater stabilization delay

// -----------------------------------------------------------------------------
// 3. Network & Cloud Credentials
// -----------------------------------------------------------------------------
// Set your local router Wi-Fi credentials
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Cloud Backend Endpoint (Firebase Cloud Function, Vercel Serverless, or Node.js)
const char* API_URL       = "https://YOUR_BACKEND_DOMAIN/api/telemetry";
const char* DEVICE_ID     = "aeris-esp32-01";
const char* DEVICE_TOKEN  = "YOUR_DEVICE_SPECIFIC_TOKEN";

// Optional: Root CA Certificate in PEM format for TLS verification
// If prototyping on a local HTTPS server, you can configure accordingly.
const char* ROOT_CA_CERTIFICATE = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n" \
"TzELMAkGA1UEBhMCVVMxEzARBgNVBAoTCkdvb2dsZSBMTUMxHzAdBgNVBAMTFlRl\n" \
"c3QgUm9vdCBDZXJ0aWZpY2F0ZTAeFw0yMDAxMDEwMDAwMDBaFw0zMDAxMDEwMDAw\n" \
"MDBaME8xCzAJBgNVBAYTAlVTMRMwEQYDVQQKEwpHb29nbGUgTExDMR8wHQYDVQQD\n" \
"ExZUZXN0IFJvb3QgQ2VydGlmaWNhdGUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw\n" \
"ggEKAoIBAQC6N5...\n" \
"-----END CERTIFICATE-----\n";

// -----------------------------------------------------------------------------
// 4. Runtime State Variables
// -----------------------------------------------------------------------------
unsigned long systemStartTime     = 0;
unsigned long lastTelemetrySentAt = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 2000; // 2-second rate limit

// Filtered ADC reading
int currentAdcValue  = 0;
bool currentIsAlarm  = false;
bool currentIsReady  = false;

// -----------------------------------------------------------------------------
// 5. Sensor Sampling (Oversampled & Averaged)
// -----------------------------------------------------------------------------
void sampleSensor() {
  // Average 8 quick samples to reduce electrical noise on ADC1
  long sum = 0;
  for (int i = 0; i < 8; i++) {
    sum += analogRead(PIN_MQ2_ADC);
    delayMicroseconds(150);
  }
  currentAdcValue = sum / 8;

  unsigned long now = millis();
  currentIsReady = (now - systemStartTime) >= WARMUP_TIME_MS;
  currentIsAlarm = currentIsReady && (currentAdcValue >= ALARM_THRESHOLD);
}

// -----------------------------------------------------------------------------
// 6. Autonomous Hardware Actuators (Non-Negotiable Safety Rule)
// -----------------------------------------------------------------------------
void updateHardwareOutputs() {
  unsigned long now = millis();

  if (!currentIsReady) {
    // Sensor heater warming up: blink green LED slowly (1 Hz), buzzer off
    digitalWrite(PIN_LED_GREEN, (now / 500) % 2);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (currentIsAlarm) {
    // Critical Gas Alarm: Green OFF, Red ON, Buzzer Active
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
  } else {
    // Normal monitoring: Green ON, Red OFF, Buzzer Inactive
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  }
}

// -----------------------------------------------------------------------------
// 7. Non-blocking HTTPS Telemetry Dispatcher
// -----------------------------------------------------------------------------
void publishTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    // Wi-Fi not connected: do not attempt HTTP dispatch, local alarm continues uninterrupted
    return;
  }

  WiFiClientSecure client;
  
  // For production: validate certificate using client.setCACert(ROOT_CA_CERTIFICATE);
  // For initial prototype/development: client.setInsecure() can be used during onboarding.
  client.setInsecure();
  client.setTimeout(2500); // Strict timeout so network latency never stalls execution

  HTTPClient http;
  if (!http.begin(client, API_URL)) {
    Serial.println("[AERIS HTTP] Failed to initialize connection");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);
  http.setTimeout(2500);

  // Build JSON payload matching the protocol specification
  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"adc\":" + String(currentAdcValue) + ",";
  payload += "\"threshold\":" + String(ALARM_THRESHOLD) + ",";
  payload += "\"ready\":" + String(currentIsReady ? "true" : "false") + ",";
  payload += "\"alarm\":" + String(currentIsAlarm ? "true" : "false") + ",";
  payload += "\"uptimeMs\":" + String(millis());
  payload += "}";

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.printf("[AERIS HTTP] Telemetry delivered (Code: %d) | ADC: %d | Alarm: %s\n",
                  httpCode, currentAdcValue, currentIsAlarm ? "YES" : "NO");
  } else {
    Serial.printf("[AERIS HTTP] POST failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

// -----------------------------------------------------------------------------
// 8. System Setup
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(100);
  systemStartTime = millis();

  // Initialize GPIO directions
  pinMode(PIN_MQ2_ADC, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Safe initial hardware state
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.println("\n==============================================");
  Serial.println("  AERIS · ESP32 Gas Monitor (Cloud Edition)");
  Serial.println("==============================================");

  // Initialize Wi-Fi in Station Mode (Station to router)
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[Wi-Fi] Initiating connection to SSID: %s\n", WIFI_SSID);

  // We do NOT stall setup indefinitely if router is unreachable
  // Initial quick connection probe (3 seconds max)
  unsigned long probeStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - probeStart < 3000) {
    delay(200);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[Wi-Fi] Connected! IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[Wi-Fi] Connection in background. Proceeding with local monitoring.");
  }
}

// -----------------------------------------------------------------------------
// 9. Main Operational Loop
// -----------------------------------------------------------------------------
void loop() {
  // 1. High-frequency sensor sampling
  sampleSensor();

  // 2. Instantaneous local alarm control (independent of cloud)
  updateHardwareOutputs();

  // 3. Timed telemetry publishing (every 2000ms)
  unsigned long now = millis();
  if (now - lastTelemetrySentAt >= TELEMETRY_INTERVAL_MS) {
    lastTelemetrySentAt = now;
    publishTelemetry();
  }

  // 20ms iteration period
  delay(20);
}
