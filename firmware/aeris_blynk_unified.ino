/*
  ========================================================================
  AERIS · Unified ESP32 Gas & Flame Safety System
  Integrated with:
    1. Local Hardware Actuators (Green LED 18, Red LED 19, Buzzer 23)
    2. Analog MQ-2 Gas Sensor (GPIO 34) & Flame Sensor (GPIO 35)
    3. Blynk IoT Cloud (Mobile Push Notifications & Blynk App Widgets)
    4. AERIS Web Dashboard (Local REST API & Vercel Cloud Telemetry)
  ========================================================================
*/

// --- BLYNK CONFIGURATION ---
// (Copy these 3 lines directly from your Blynk Console -> Device Info)
#define BLYNK_TEMPLATE_ID   "Your_Template_ID"
#define BLYNK_TEMPLATE_NAME "GAS or FLAME ALERT"
#define BLYNK_AUTH_TOKEN    "Your_Auth_Token"

#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <BlynkSimpleEsp32.h>
#include <WebServer.h>
#include <HTTPClient.h>

// --- WI-FI CREDENTIALS ---
// (Set your home/mobile hotspot Wi-Fi credentials here)
char ssid[] = "Your_WiFi_SSID";
char pass[] = "Your_WiFi_Password";

// --- VERCEL CLOUD ENDPOINT ---
// (Streams telemetry live to your Vercel web dashboard)
const char* VERCEL_API_URL = "https://gasdetection.vercel.app/api/telemetry"; 

// --- HARDWARE PIN DEFINITIONS ---
#define PIN_MQ2_ADC   34   // MQ-2 Analog AO pin (12-bit ADC: 0 - 4095)
#define PIN_FLAME     35   // Flame Sensor digital output (LOW = Flame Detected)
#define PIN_LED_GREEN 18   // Safe indicator (Green LED via 220R)
#define PIN_LED_RED   19   // Alert indicator (Red LED via 220R)
#define PIN_BUZZER    23   // Alarm Buzzer (via NPN Transistor / Active Buzzer)

// --- SAFETY THRESHOLDS ---
const int GAS_THRESHOLD_HIGH = 1800; // Trip ADC value
const int GAS_THRESHOLD_LOW  = 1650; // Hysteresis reset ADC value
const unsigned long WARMUP_MS = 25000; // MQ-2 heater warmup (25 seconds)

// --- SYSTEM STATE ---
unsigned long systemStartTime = 0;
bool isAlarmActive = false;
bool isFlameDetected = false;
int currentGasADC = 0;
float currentPinVolts = 0.0;
float currentSensorVolts = 0.0;

// Rate-limiting for Blynk event notifications (prevent spamming limits)
unsigned long lastBlynkGasAlert = 0;
unsigned long lastBlynkFireAlert = 0;
const unsigned long BLYNK_ALERT_COOLDOWN_MS = 15000; // 15s between push notifications

WebServer localServer(80);
BlynkTimer timer;

// Average 20 ADC readings for smooth, stable measurements
int readGasADC() {
  long sum = 0;
  for (int i = 0; i < 20; i++) {
    sum += analogRead(PIN_MQ2_ADC);
    delay(2);
  }
  return (int)(sum / 20);
}

// REST API for AERIS Web Dashboard
void handleApi() {
  unsigned long now = millis();
  bool isReady = (now - systemStartTime) >= WARMUP_MS;

  String json = "{";
  json += "\"adc\":" + String(currentGasADC) + ",";
  json += "\"pinVoltage\":" + String(currentPinVolts, 2) + ",";
  json += "\"sensorVoltage\":" + String(currentSensorVolts, 2) + ",";
  json += "\"flame\":" + String(isFlameDetected ? "true" : "false") + ",";
  json += "\"threshold\":" + String(GAS_THRESHOLD_HIGH) + ",";
  json += "\"alarm\":" + String(isAlarmActive ? "true" : "false") + ",";
  json += "\"ready\":" + String(isReady ? "true" : "false") + ",";
  json += "\"green_led\":" + String((isReady && !isAlarmActive) ? "true" : "false") + ",";
  json += "\"red_led\":" + String(isAlarmActive ? "true" : "false") + ",";
  json += "\"buzzer\":" + String(isAlarmActive ? "true" : "false");
  json += "}";

  localServer.sendHeader("Access-Control-Allow-Origin", "*");
  localServer.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  localServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  localServer.send(200, "application/json", json);
}

// Periodic Sensor Evaluation (Runs every 1 second)
void checkSensors() {
  unsigned long now = millis();
  bool isWarmedUp = (now - systemStartTime) >= WARMUP_MS;

  // 1. Read Sensors
  currentGasADC = readGasADC();
  currentPinVolts = (currentGasADC / 4095.0) * 3.3;
  currentSensorVolts = currentPinVolts / 0.625; // Voltage divider correction

  // Flame sensor output is active LOW (LOW = Flame Detected)
  isFlameDetected = (digitalRead(PIN_FLAME) == LOW);

  // 2. Evaluate Alarm Condition (Gas OR Flame)
  bool gasExceeded = (currentGasADC >= GAS_THRESHOLD_HIGH);
  if (currentGasADC < GAS_THRESHOLD_LOW && !isFlameDetected) {
    isAlarmActive = false;
  } else if (gasExceeded || isFlameDetected) {
    isAlarmActive = true;
  }

  // 3. Actuator Hardware Control (Independent of Wi-Fi state)
  if (!isWarmedUp) {
    // Warmup blinking (Green LED blinks every second)
    digitalWrite(PIN_LED_GREEN, (now / 500) % 2);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (isAlarmActive) {
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_BUZZER, HIGH);
  } else {
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_BUZZER, LOW);
  }

  // 4. Serial Debug Output
  Serial.print("Gas ADC: ");
  Serial.print(currentGasADC);
  Serial.print(" (");
  Serial.print(currentPinVolts, 2);
  Serial.print("V) | Flame: ");
  Serial.print(isFlameDetected ? "🔥 FLAME DETECTED" : "Safe");
  Serial.print(" | Status: ");
  Serial.println(isAlarmActive ? "⚠️ ALARM ACTIVE!" : "Normal");

  // 5. Sync to Blynk IoT Cloud (if connected)
  if (Blynk.connected()) {
    Blynk.virtualWrite(V0, currentGasADC);                  // Gauge widget: Gas ADC
    Blynk.virtualWrite(V1, isFlameDetected ? 1 : 0);        // LED/Status widget: Flame
    Blynk.virtualWrite(V2, isAlarmActive ? 1 : 0);          // LED/Status widget: Master Alarm
    Blynk.virtualWrite(V3, String(currentPinVolts, 2) + "V"); // Value Display: Volts

    // Push Notification for Gas
    if (gasExceeded && (now - lastBlynkGasAlert > BLYNK_ALERT_COOLDOWN_MS)) {
      Blynk.logEvent("gas_alert", "⚠️ Gas Leakage Detected! ADC: " + String(currentGasADC));
      lastBlynkGasAlert = now;
    }

    // Push Notification for Fire
    if (isFlameDetected && (now - lastBlynkFireAlert > BLYNK_ALERT_COOLDOWN_MS)) {
      Blynk.logEvent("fire_alert", "🔥 Fire / Flame Detected in Facility!");
      lastBlynkFireAlert = now;
    }
  }

  // 6. Post Telemetry to Vercel Cloud Backend over HTTPS
  if (WiFi.status() == WL_CONNECTED && strlen(VERCEL_API_URL) > 8) {
    WiFiClientSecure secureClient;
    secureClient.setInsecure(); // Connect securely to Vercel HTTPS
    secureClient.setTimeout(2500);

    HTTPClient http;
    if (http.begin(secureClient, VERCEL_API_URL)) {
      http.addHeader("Content-Type", "application/json");

      String payload = "{";
      payload += "\"deviceId\":\"AERIS-01\",";
      payload += "\"adc\":" + String(currentGasADC) + ",";
      payload += "\"flame\":" + String(isFlameDetected ? "true" : "false") + ",";
      payload += "\"alarm\":" + String(isAlarmActive ? "true" : "false") + ",";
      payload += "\"ready\":" + String(isWarmedUp ? "true" : "false");
      payload += "}";

      http.POST(payload);
      http.end();
    }
  }
}

void setup() {
  Serial.begin(115200);

  // Initialize Pin Modes
  pinMode(PIN_MQ2_ADC, INPUT);
  pinMode(PIN_FLAME, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // 12-bit ADC Resolution (0 - 4095) with 11dB attenuation for 0 - 3.3V range
  analogReadResolution(12);
  analogSetPinAttenuation(PIN_MQ2_ADC, ADC_11db);

  Serial.println("=========================================");
  Serial.println("AERIS IoT · Gas & Flame Safety System");
  Serial.println("=========================================");

  // Connect to Wi-Fi and Blynk
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  // Start Local Web Server
  localServer.on("/api", HTTP_GET, handleApi);
  localServer.begin();

  Serial.print("Local IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println("Sensor warming up (25s)...");

  systemStartTime = millis();

  // Run sensor check every 1000ms (1 second)
  timer.setInterval(1000L, checkSensors);
}

void loop() {
  // Blynk background connection handler
  if (WiFi.status() == WL_CONNECTED) {
    Blynk.run();
  }

  timer.run();             // Timer triggers checkSensors() every 1s
  localServer.handleClient(); // Handles requests from web dashboard
}
