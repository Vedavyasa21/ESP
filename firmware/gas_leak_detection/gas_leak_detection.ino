/*
  =============================================================================
  AERIS · ESP32 Gas Leakage Detection & Monitoring System
  Dual-Mode Wi-Fi: SoftAP Hotspot + Router/Mobile Hotspot + Live Vercel Sync
  =============================================================================
  
  WI-FI CONNECTION CREDENTIALS:
  -----------------------------------------------------------------------------
  1. ESP32 Built-in Wi-Fi Hotspot (No Router Needed):
     - Wi-Fi SSID (Name) : ESP32_GAS_ALERT
     - Wi-Fi Password    : 12345678
     - Web Dashboard URL : http://192.168.4.1
     (Connect your phone or laptop to "ESP32_GAS_ALERT", open http://192.168.4.1)

  2. Router or Mobile Phone Hotspot (For Vercel Cloud Sync):
     - Turn on your phone's personal hotspot with:
       SSID: ESP32_HOTSPOT
       Password: password123
       Band: 2.4 GHz
     - Or edit the STA_SSID and STA_PASS lines below with your own Wi-Fi!

  3. Vercel Cloud Dashboard:
     - https://gasdetection.vercel.app/
  =============================================================================
*/

#include <WiFi.h>
#include <WebServer.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// -----------------------------------------------------------------------------
// 1. Wi-Fi Configuration
// -----------------------------------------------------------------------------
// Option A: Your Phone Hotspot or Home Router Wi-Fi
// (Turn on your phone hotspot with these credentials, or change to yours)
const char* STA_SSID = "ESP32_HOTSPOT";
const char* STA_PASS = "password123";

// Option B: ESP32 Built-in Wi-Fi Access Point (Always broadcasts!)
const char* AP_SSID  = "ESP32_GAS_ALERT";
const char* AP_PASS  = "12345678";

// Live Vercel Telemetry Ingestion Endpoint
const char* VERCEL_API_URL = "https://gasdetection.vercel.app/api/telemetry";
const char* DEVICE_ID      = "AERIS-01";

// -----------------------------------------------------------------------------
// 2. Hardware Pin Definitions
// -----------------------------------------------------------------------------
#define PIN_MQ2_ADC   34   // Analog AO pin from MQ-2 Sensor (0 - 4095)
#define PIN_FLAME     35   // Flame Sensor digital output (LOW = Flame Detected)
#define PIN_LED_GREEN 18   // Safe State Green LED
#define PIN_LED_RED   19   // Hazard State Red LED
#define PIN_BUZZER    23   // Piezo Buzzer

// Safety Thresholds
const int GAS_THRESHOLD_HIGH = 1800; // Trip ADC value
const int GAS_THRESHOLD_LOW  = 1650; // Hysteresis clear ADC value
const unsigned long WARMUP_MS = 15000; // 15-second sensor warmup stabilization

// -----------------------------------------------------------------------------
// 3. Global State
// -----------------------------------------------------------------------------
WebServer server(80);
unsigned long systemStartTime = 0;
unsigned long lastVercelPost = 0;
int currentGasVal = 0;
float currentPinVolts = 0.0;
bool isAlarmActive = false;
bool isFlameDetected = false;
bool isStationConnected = false;

// Sample & Average 15 ADC readings
int readGasVal() {
  long total = 0;
  for (int i = 0; i < 15; i++) {
    total += analogRead(PIN_MQ2_ADC);
    delay(3);
  }
  return (int)(total / 15);
}

// -----------------------------------------------------------------------------
// 4. Web Server Handlers
// -----------------------------------------------------------------------------
// Returns live reading in JSON format
void handleApi() {
  unsigned long now = millis();
  bool isReady = (now - systemStartTime) >= WARMUP_MS;

  String json = "{";
  json += "\"val\":" + String(currentGasVal) + ",";
  json += "\"adc\":" + String(currentGasVal) + ",";
  json += "\"pinVoltage\":" + String(currentPinVolts, 2) + ",";
  json += "\"sensorVoltage\":" + String(currentPinVolts / 0.625, 2) + ",";
  json += "\"flame\":" + String(isFlameDetected ? "true" : "false") + ",";
  json += "\"threshold\":" + String(GAS_THRESHOLD_HIGH) + ",";
  json += "\"alarm\":" + String(isAlarmActive ? "true" : "false") + ",";
  json += "\"ready\":" + String(isReady ? "true" : "false") + ",";
  json += "\"green_led\":" + String((isReady && !isAlarmActive) ? "true" : "false") + ",";
  json += "\"red_led\":" + String(isAlarmActive ? "true" : "false") + ",";
  json += "\"buzzer\":" + String(isAlarmActive ? "true" : "false") + ",";
  json += "\"wifi_mode\":\"" + String(isStationConnected ? "STA+AP" : "AP_ONLY") + "\",";
  json += "\"uptimeMs\":" + String(now);
  json += "}";

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.send(200, "application/json", json);
}

// Returns raw plain-text val (e.g. "842")
void handleRawVal() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", String(currentGasVal));
}

// Serves self-contained live mobile/desktop dashboard at http://192.168.4.1
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>"
    "<meta name='viewport' content='width=device-width,initial-scale=1'>"
    "<title>ESP32 Gas Monitor · Live Val</title>"
    "<style>"
    "body{font-family:-apple-system,system-ui,sans-serif;background:#0F1215;color:#FFF;margin:0;padding:16px;text-align:center;}"
    ".card{max-width:440px;margin:16px auto;background:#1A1F26;border:1px solid #2C3540;border-radius:24px;padding:24px;box-shadow:0 12px 32px rgba(0,0,0,0.5);}"
    "h1{font-size:13px;text-transform:uppercase;letter-spacing:2.5px;color:#8C9BAE;margin:0 0 16px;}"
    ".val-box{background:#12161C;border-radius:20px;padding:24px 16px;margin:16px 0;border:1px solid #232A34;}"
    ".val{font-size:64px;font-weight:900;font-family:monospace;color:#4EBE82;letter-spacing:-2px;margin:8px 0;}"
    ".unit{font-size:11px;font-weight:700;letter-spacing:1.5px;color:#8C9BAE;text-transform:uppercase;}"
    ".badge{display:inline-block;padding:7px 20px;border-radius:50px;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;}"
    ".safe{background:rgba(78,190,130,0.15);color:#4EBE82;border:1px solid #4EBE82;}"
    ".alarm{background:rgba(235,77,75,0.2);color:#EB4D4B;border:1px solid #EB4D4B;animation:pulse 0.9s infinite;}"
    "@keyframes pulse{0%{opacity:1}50%{opacity:0.4}100%{opacity:1}}"
    ".grid{display:grid;grid-template-cols:1fr 1fr;gap:10px;margin-top:16px;font-size:12px;}"
    ".metric{background:#12161C;padding:12px;border-radius:12px;border:1px solid #232A34;text-align:left;}"
    ".metric span{display:block;font-size:10px;color:#8C9BAE;text-transform:uppercase;font-weight:700;margin-bottom:4px;}"
    ".metric strong{font-size:14px;color:#FFF;}"
    ".btn{display:block;background:#4EBE82;color:#0F1215;font-weight:800;text-decoration:none;padding:14px;border-radius:14px;margin-top:18px;font-size:13px;}"
    "</style></head><body>"
    "<div class='card'>"
    "<h1>ESP32 Gas Leakage Monitor</h1>"
    "<div id='badge' class='badge safe'>MONITORING ACTIVE</div>"
    "<div class='val-box'>"
    "<div class='unit'>Current Gas Reading (val)</div>"
    "<div id='val' class='val'>---</div>"
    "<div class='unit'>ADC (0 - 4095) · Trip Threshold: 1800</div>"
    "</div>"
    "<div class='grid'>"
    "<div class='metric'><span>Flame Sensor</span><strong id='flame'>SAFE</strong></div>"
    "<div class='metric'><span>Hardware Buzzer</span><strong id='buzzer'>OFF</strong></div>"
    "<div class='metric'><span>Sensor Pin Voltage</span><strong id='volts'>0.00 V</strong></div>"
    "<div class='metric'><span>Wi-Fi Network</span><strong id='wifi'>ESP32_GAS_ALERT</strong></div>"
    "</div>"
    "<a href='https://gasdetection.vercel.app' target='_blank' class='btn'>Open Vercel Cloud Web</a>"
    "</div>"
    "<script>"
    "async function update(){"
    "  try{"
    "    const res = await fetch('/api?_=' + Date.now());"
    "    const d = await res.json();"
    "    document.getElementById('val').innerText = d.val || d.adc;"
    "    document.getElementById('volts').innerText = d.pinVoltage + ' V';"
    "    document.getElementById('flame').innerText = d.flame ? '🔥 DETECTED' : 'SAFE';"
    "    document.getElementById('buzzer').innerText = d.alarm ? 'ACTIVE 🚨' : 'OFF';"
    "    const b = document.getElementById('badge');"
    "    const v = document.getElementById('val');"
    "    if(d.alarm){"
    "      b.className='badge alarm'; b.innerText='🚨 GAS LEAK DETECTED';"
    "      v.style.color='#EB4D4B';"
    "    } else {"
    "      b.className='badge safe'; b.innerText='NORMAL & SAFE';"
    "      v.style.color='#4EBE82';"
    "    }"
    "  }catch(e){}"
    "}"
    "setInterval(update, 800);"
    "update();"
    "</script>"
    "</body></html>";

  server.send(200, "text/html", html);
}

// -----------------------------------------------------------------------------
// 5. Cloud Telemetry Sender (Vercel HTTPS POST)
// -----------------------------------------------------------------------------
void postToVercel(bool isReady) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Secure TLS to Vercel without root CA hurdles
  client.setTimeout(2500);

  HTTPClient http;
  if (http.begin(client, VERCEL_API_URL)) {
    http.addHeader("Content-Type", "application/json");

    String json = "{";
    json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
    json += "\"adc\":" + String(currentGasVal) + ",";
    json += "\"val\":" + String(currentGasVal) + ",";
    json += "\"pinVoltage\":" + String(currentPinVolts, 2) + ",";
    json += "\"threshold\":" + String(GAS_THRESHOLD_HIGH) + ",";
    json += "\"flame\":" + String(isFlameDetected ? "true" : "false") + ",";
    json += "\"alarm\":" + String(isAlarmActive ? "true" : "false") + ",";
    json += "\"ready\":" + String(isReady ? "true" : "false");
    json += "}";

    int code = http.POST(json);
    if (code > 0) {
      Serial.printf("[VERCEL] Telemetry Sent! HTTP %d | val: %d\n", code, currentGasVal);
    } else {
      Serial.printf("[VERCEL] POST failed: %s\n", http.errorToString(code).c_str());
    }
    http.end();
  }
}

// -----------------------------------------------------------------------------
// 6. Setup
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(100);
  systemStartTime = millis();

  // Initialize GPIOs
  pinMode(PIN_MQ2_ADC, INPUT);
  pinMode(PIN_FLAME, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  analogReadResolution(12);
  analogSetPinAttenuation(PIN_MQ2_ADC, ADC_11db);

  Serial.println("\n========================================================");
  Serial.println("  AERIS · ESP32 Gas Leakage Detection System");
  Serial.println("========================================================");

  // Enable BOTH SoftAP and Station mode concurrently!
  WiFi.mode(WIFI_AP_STA);

  // 1. Start ESP32 built-in Wi-Fi Hotspot (Always works!)
  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.println("[Wi-Fi AP] Broadcasting ESP32 Hotspot:");
  Serial.printf("           SSID     : %s\n", AP_SSID);
  Serial.printf("           Password : %s\n", AP_PASS);
  Serial.print("           Web URL  : http://");
  Serial.println(WiFi.softAPIP());

  // 2. Try connecting to phone hotspot / router Wi-Fi (station mode)
  Serial.printf("[Wi-Fi STA] Connecting to router/hotspot: %s...\n", STA_SSID);
  WiFi.begin(STA_SSID, STA_PASS);

  // Non-blocking 4-second probe (hardware monitoring will not hang!)
  unsigned long probeStart = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - probeStart < 4000)) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    isStationConnected = true;
    Serial.print("[Wi-Fi STA] Connected to hotspot! LAN IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[Wi-Fi STA] Hotspot not connected. Continuing in AP Mode.");
    Serial.println("[Wi-Fi AP]  Connect your phone to 'ESP32_GAS_ALERT' (pass: 12345678)!");
  }

  // Start internal HTTP Web Server
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api", HTTP_GET, handleApi);
  server.on("/val", HTTP_GET, handleRawVal);
  server.begin();
  Serial.println("[HTTP] Server ready on port 80!");
  Serial.println("========================================================\n");
}

// -----------------------------------------------------------------------------
// 7. Main Operational Loop
// -----------------------------------------------------------------------------
void loop() {
  server.handleClient();

  unsigned long now = millis();
  bool isReady = (now - systemStartTime) >= WARMUP_MS;

  // 1. Read Gas Sensor (val) & Flame Sensor
  currentGasVal = readGasVal();
  currentPinVolts = (currentGasVal / 4095.0) * 3.3;
  isFlameDetected = (digitalRead(PIN_FLAME) == LOW); // Active LOW

  // 2. Evaluate Alarm
  bool gasExceeded = (currentGasVal >= GAS_THRESHOLD_HIGH);
  if (currentGasVal < GAS_THRESHOLD_LOW && !isFlameDetected) {
    isAlarmActive = false;
  } else if (gasExceeded || isFlameDetected) {
    isAlarmActive = true;
  }

  // 3. Autonomous Local Hardware Actuators (Never blocked!)
  if (!isReady) {
    // Warmup: blink green LED slowly
    digitalWrite(PIN_LED_GREEN, (now / 500) % 2);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (isAlarmActive) {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
  } else {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  }

  // 4. Print live values (val) to Serial Monitor every 1 second
  static unsigned long lastSerialPrint = 0;
  if (now - lastSerialPrint >= 1000) {
    lastSerialPrint = now;
    Serial.printf("[GAS READING] val: %d | Voltage: %.2fV | Flame: %s | Status: %s\n",
                  currentGasVal,
                  currentPinVolts,
                  isFlameDetected ? "🔥 FLAME DETECTED" : "SAFE",
                  isAlarmActive ? "🚨 ALARM HIGH!" : "NORMAL");
  }

  // 5. Send telemetry to Vercel Cloud every 2 seconds
  if (now - lastVercelPost >= 2000) {
    lastVercelPost = now;
    if (WiFi.status() == WL_CONNECTED) {
      isStationConnected = true;
      postToVercel(isReady);
    } else {
      isStationConnected = false;
    }
  }

  delay(20);
}
