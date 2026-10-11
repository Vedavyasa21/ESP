/*
  =============================================================================
  AERIS · INDUSTRIAL ESP32 GAS MONITOR & TELEGRAM BOT FIRMWARE
  =============================================================================
  Features:
  - Non-blocking FreeRTOS architecture (Telegram on Core 0, Sensors on Core 1)
  - TLS 1.2/1.3 Secure HTTPS Bot integration with Go Daddy Root CA G2 verification
  - Dual Wi-Fi AP + Station mode with auto-reconnection
  - Edge-triggered alarm & recovery notifications with configurable cooldown
  - Interactive Telegram commands: /start, /status, /threshold, /help
  - Chat ID access authorization and sanitized logging (tokens never leaked)
  - Local Web Dashboard at http://192.168.4.1 and REST API (/api, /val)
  =============================================================================
*/

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include "telegram_service.h"

// -----------------------------------------------------------------------------
// 1. HARDWARE PIN ASSIGNMENTS (Preserved from AERIS hardware spec)
// -----------------------------------------------------------------------------
#define PIN_MQ2_ADC   34   // Analog AO pin from MQ-2 Gas/Smoke Sensor (0 - 4095)
#define PIN_FLAME     35   // Digital Flame Sensor input (Active LOW: LOW = Flame)
#define PIN_LED_GREEN 18   // Safe State Green/Blue Indicator LED
#define PIN_LED_RED   19   // Hazard State Red Alert Strobe LED
#define PIN_BUZZER    23   // Active Siren / Piezo Buzzer (2N2222 NPN Driven)
#define ENABLE_FLAME_SENSOR 0 // Set to 1 only if physical flame sensor is wired to GPIO 35 (prevents floating pin false alarms)

// -----------------------------------------------------------------------------
// 2. SAFETY THRESHOLDS & HYSTERESIS
// -----------------------------------------------------------------------------
int gasThresholdHigh = 1800; // Trip ADC value (Alarm activates >= 1800)
int gasThresholdLow  = 1650; // Recovery ADC value (Alarm clears < 1650)
const unsigned long WARMUP_MS = 5000; // 5-second initial sensor stabilization window

// -----------------------------------------------------------------------------
// 3. SYSTEM STATE & TIMING
// -----------------------------------------------------------------------------
WebServer server(80);

int currentGasVal = 0;
float currentPinVolts = 0.0;
float currentSensorVolts = 0.0;
bool isAlarmActive = false;
bool prevAlarmState = false;
bool isFlameDetected = false;
bool isSystemReady = false;
bool startupNotifSent = false;

unsigned long systemStartTime = 0;
unsigned long lastSerialPrint = 0;
unsigned long lastAlarmTime = 0;
unsigned long lastWifiCheck = 0;

// -----------------------------------------------------------------------------
// 4. TELEGRAM SERVICE CALLBACKS
// -----------------------------------------------------------------------------
// Provides real-time telemetry snapshot to Telegram background task (/status)
void getSystemTelemetry(int& outAdc, float& outVolts, int& outThreshold, bool& outAlarm, bool& outFlame, unsigned long& outUptimeMs) {
  outAdc = currentGasVal;
  outVolts = currentPinVolts;
  outThreshold = gasThresholdHigh;
  outAlarm = isAlarmActive;
  outFlame = isFlameDetected;
  outUptimeMs = millis() - systemStartTime;
}

// Optional callback to adjust threshold remotely (/setthreshold, if enabled in secrets.h)
void setSystemThreshold(int newThreshold) {
  gasThresholdHigh = newThreshold;
  gasThresholdLow = newThreshold - 150; // maintain hysteresis margin
  Serial.printf("[CONFIG] Alarm threshold remotely updated: HIGH=%d, LOW=%d\n", gasThresholdHigh, gasThresholdLow);
}

// -----------------------------------------------------------------------------
// 5. OVERSAMPLED ANALOG SENSOR FILTER
// -----------------------------------------------------------------------------
// Averages 15 rapid samples with 250us spacing to eliminate ADC electrical ripple
int readGasVal() {
  long total = 0;
  for (int i = 0; i < 15; i++) {
    total += analogRead(PIN_MQ2_ADC);
    delayMicroseconds(250);
  }
  return (int)(total / 15);
}

// -----------------------------------------------------------------------------
// 6. LOCAL WEB SERVER HANDLERS (HTTP Port 80)
// -----------------------------------------------------------------------------
void handleApi() {
  unsigned long now = millis();
  bool ready = (now - systemStartTime) >= WARMUP_MS;

  String json = "{";
  json += "\"val\":" + String(currentGasVal) + ",";
  json += "\"adc\":" + String(currentGasVal) + ",";
  json += "\"pinVoltage\":" + String(currentPinVolts, 2) + ",";
  json += "\"sensorVoltage\":" + String(currentSensorVolts, 2) + ",";
  json += "\"flame\":" + String(isFlameDetected ? "true" : "false") + ",";
  json += "\"threshold\":" + String(gasThresholdHigh) + ",";
  json += "\"alarm\":" + String(isAlarmActive ? "true" : "false") + ",";
  json += "\"ready\":" + String(ready ? "true" : "false") + ",";
  json += "\"telegram_connected\":" + String(telegramService.isConnected() ? "true" : "false") + ",";
  json += "\"wifi_rssi\":" + String(WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0) + ",";
  json += "\"uptimeMs\":" + String(now - systemStartTime);
  json += "}";

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.send(200, "application/json", json);
}

void handleRawVal() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", String(currentGasVal));
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>"
    "<meta name='viewport' content='width=device-width,initial-scale=1'>"
    "<title>AERIS · ESP32 Gas Monitor</title>"
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
    ".grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;font-size:12px;}"
    ".metric{background:#12161C;padding:12px;border-radius:12px;border:1px solid #232A34;text-align:left;}"
    ".metric span{display:block;font-size:10px;color:#8C9BAE;text-transform:uppercase;font-weight:700;margin-bottom:4px;}"
    ".metric strong{font-size:14px;color:#FFF;}"
    "</style></head><body>"
    "<div class='card'>"
    "<h1>AERIS Gas Node & Telegram Monitor</h1>"
    "<div id='badge' class='badge safe'>MONITORING ACTIVE</div>"
    "<div class='val-box'>"
    "<div class='unit'>Real-Time Gas Reading (ADC)</div>"
    "<div id='val' class='val'>---</div>"
    "<div class='unit'>Trip Threshold: " + String(gasThresholdHigh) + " ADC</div>"
    "</div>"
    "<div class='grid'>"
    "<div class='metric'><span>Telegram Bot</span><strong id='tg'>CONNECTING...</strong></div>"
    "<div class='metric'><span>Flame Sensor</span><strong id='flame'>SAFE</strong></div>"
    "<div class='metric'><span>Hardware Siren</span><strong id='buzzer'>OFF</strong></div>"
    "<div class='metric'><span>Pin Voltage</span><strong id='volts'>0.00 V</strong></div>"
    "</div>"
    "</div>"
    "<script>"
    "async function update(){"
    "  try{"
    "    const res = await fetch('/api?_=' + Date.now());"
    "    const d = await res.json();"
    "    document.getElementById('val').innerText = d.val;"
    "    document.getElementById('volts').innerText = d.pinVoltage + ' V';"
    "    document.getElementById('flame').innerText = d.flame ? '🔥 DETECTED' : 'SAFE';"
    "    document.getElementById('buzzer').innerText = d.alarm ? 'ACTIVE 🚨' : 'OFF';"
    "    document.getElementById('tg').innerText = d.telegram_connected ? 'ONLINE ✅' : 'STANDBY';"
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
    "setInterval(update, 1000);"
    "update();"
    "</script>"
    "</body></html>";

  server.send(200, "text/html", html);
}

// -----------------------------------------------------------------------------
// 7. SETUP
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(100);
  systemStartTime = millis();

  // Initialize GPIO hardware pins
  pinMode(PIN_MQ2_ADC, INPUT);
  pinMode(PIN_FLAME, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Guarantee all alert actuators are OFF at boot
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // 12-Bit ADC (0 - 4095 counts) with 11dB attenuation (~3.3V range)
  analogReadResolution(12);
  analogSetPinAttenuation(PIN_MQ2_ADC, ADC_11db);

  Serial.println("\n========================================================");
  Serial.println("  AERIS · ESP32 GAS MONITOR WITH TELEGRAM ALERTS");
  Serial.println("========================================================");
  Serial.printf(" Hardware Pinout: MQ2=%d | GREEN=%d | RED=%d | BUZZER=%d | FLAME=%d\n",
                PIN_MQ2_ADC, PIN_LED_GREEN, PIN_LED_RED, PIN_BUZZER, PIN_FLAME);
  Serial.printf(" Safety Settings: Trip Threshold = %d ADC | Clear = %d ADC\n",
                gasThresholdHigh, gasThresholdLow);

  // Configure Wi-Fi in dual AP + STA mode
  WiFi.mode(WIFI_AP_STA);

  // 1. Start local Access Point hotspot (always available for local access)
  WiFi.softAP(SECRET_AP_SSID, SECRET_AP_PASS);
  Serial.printf("[Wi-Fi AP] Broadcasting SoftAP: SSID='%s' | IP=http://%s\n",
                SECRET_AP_SSID, WiFi.softAPIP().toString().c_str());

  // 2. Connect to local Wi-Fi router / mobile hotspot for internet access
  Serial.printf("[Wi-Fi STA] Connecting to network SSID: '%s'...\n", SECRET_WIFI_SSID);
  WiFi.begin(SECRET_WIFI_SSID, SECRET_WIFI_PASS);

  // Non-blocking quick check (up to 3 seconds in setup)
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - wifiStart < 3000)) {
    delay(200);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[Wi-Fi STA] Connected! Local IP: %s | Gateway: %s\n",
                  WiFi.localIP().toString().c_str(), WiFi.gatewayIP().toString().c_str());
  } else {
    Serial.println("[Wi-Fi STA] Not yet connected. Wi-Fi reconnection engine active in background.");
  }

  // 3. Start local Web Server
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api", HTTP_GET, handleApi);
  server.on("/val", HTTP_GET, handleRawVal);
  server.begin();
  Serial.println("[HTTP] Local status web server running on port 80.");

  // 4. Start FreeRTOS Asynchronous Telegram Service on Core 0
  bool tgOk = telegramService.begin(getSystemTelemetry, setSystemThreshold);
  if (tgOk) {
    Serial.println("[Telegram] Telegram service task successfully launched on Core 0.");
  } else {
    Serial.println("[Telegram] Warning: Failed to initialize Telegram task.");
  }

  Serial.println("========================================================\n");
}

// -----------------------------------------------------------------------------
// 8. MAIN OPERATIONAL LOOP (Dedicated to Core 1 - Zero HTTPS Latency)
// -----------------------------------------------------------------------------
void loop() {
  // Handle local HTTP requests (fast, non-blocking)
  server.handleClient();

  unsigned long now = millis();
  isSystemReady = (now - systemStartTime) >= WARMUP_MS;

  // 1. Read Gas & Flame Sensors
  currentGasVal = readGasVal();
  currentPinVolts = (currentGasVal / 4095.0f) * 3.3f;
  currentSensorVolts = currentPinVolts / 0.625f; // Compensate for 12k/20k voltage divider

#if ENABLE_FLAME_SENSOR
  isFlameDetected = (digitalRead(PIN_FLAME) == LOW); // Active LOW on standard flame modules
#else
  isFlameDetected = false;
#endif

  // 2. Evaluate Alarm Condition (with Hysteresis)
  bool gasExceeded = (currentGasVal >= gasThresholdHigh);
  if (gasExceeded || isFlameDetected) {
    isAlarmActive = true;
  } else if (currentGasVal < gasThresholdLow && !isFlameDetected) {
    isAlarmActive = false;
  }

  // 3. Local Hardware Actuators (Strict priority: Local safety never depends on network)
  if (!isSystemReady) {
    // Warmup stabilization: Slow green LED pulse (500ms cycle), sirens OFF
    digitalWrite(PIN_LED_GREEN, (now / 500) % 2);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (isAlarmActive) {
    // Active Hazard: Rapid synchronized Red LED strobe and acoustic buzzer pulse (200ms)
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, (now / 200) % 2);
    digitalWrite(PIN_BUZZER, (now / 200) % 2);
  } else {
    // Normal / Safe: Solid Green LED ON, siren and alert strobe OFF
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  }

  // 4. Telegram Notification Engine (Queues into FreeRTOS Core 0 background task)
  // 4A. One-Time Startup Notification once baseline stabilizes
  if (!startupNotifSent && (now - systemStartTime > 3000)) {
    startupNotifSent = true;
    telegramService.queueNotification(NOTIF_STARTUP, currentGasVal, currentPinVolts, gasThresholdHigh, isFlameDetected);
    Serial.println("[Telegram] Startup notification enqueued.");
  }

  // 4B. Alarm State Transitions (Active once warmup completes)
  if (isSystemReady) {
    // EDGE 1: SAFE -> ALARM (Gas reading crosses threshold)
    if (isAlarmActive && !prevAlarmState) {
      prevAlarmState = true;
      if (now - lastAlarmTime >= ((unsigned long)TELEGRAM_COOLDOWN_SEC * 1000UL) || lastAlarmTime == 0) {
        lastAlarmTime = now;
        bool queued = telegramService.queueNotification(NOTIF_GAS_ALARM, currentGasVal, currentPinVolts, gasThresholdHigh, isFlameDetected);
        Serial.printf(">>> [🚨 GAS ALARM TRIP] ADC=%d >= %d! Notification queued: %s <<<\n",
                      currentGasVal, gasThresholdHigh, queued ? "YES" : "QUEUE_FULL");
      } else {
        Serial.printf("[Telegram] Gas trip (ADC=%d) occurred but blocked by cooldown.\n", currentGasVal);
      }
    }
    // EDGE 2: ALARM -> SAFE (Gas reading falls below hysteresis threshold)
    else if (!isAlarmActive && prevAlarmState) {
      prevAlarmState = false;
      lastAlarmTime = 0; // Reset cooldown so subsequent gas tests trigger immediately
      bool queued = telegramService.queueNotification(NOTIF_GAS_RECOVERY, currentGasVal, currentPinVolts, gasThresholdHigh, isFlameDetected);
      Serial.printf(">>> [✅ GAS RECOVERY] ADC=%d < %d! Recovery notification queued: %s <<<\n",
                    currentGasVal, gasThresholdLow, queued ? "YES" : "QUEUE_FULL");
    }
  }

  // 5. Periodic Wi-Fi Reconnection Logic (Every 8s if disconnected)
  if (WiFi.status() != WL_CONNECTED && (now - lastWifiCheck >= 8000)) {
    lastWifiCheck = now;
    Serial.printf("[Wi-Fi STA WARNING] Disconnected! Reconnecting to '%s'...\n", SECRET_WIFI_SSID);
    WiFi.disconnect();
    WiFi.begin(SECRET_WIFI_SSID, SECRET_WIFI_PASS);
  }

  // 6. Serial Telemetry Logging (Every 1000ms)
  if (now - lastSerialPrint >= 1000) {
    lastSerialPrint = now;
    if (!isSystemReady) {
      int remaining = (int)((WARMUP_MS - (now - systemStartTime)) / 1000);
      Serial.printf("[WARMUP] Stabilizing sensor (%ds left)... ADC: %d | Voltage: %.2fV\n",
                    remaining, currentGasVal, currentPinVolts);
    } else {
      Serial.printf("[STATUS] ADC: %4d | Pin: %.2fV | Flame: %s | Alarm: %s | Wi-Fi: %s | TG: %s\n",
                    currentGasVal,
                    currentPinVolts,
                    isFlameDetected ? "FLAME!" : "OK",
                    isAlarmActive ? "ACTIVE🚨" : "CLEAR",
                    WiFi.status() == WL_CONNECTED ? "ONLINE" : "OFFLINE",
                    telegramService.isConnected() ? "SYNCED" : "PENDING");
    }
  }

  // Minimal yield to allow system tasks on Core 1
  delay(15);
}
