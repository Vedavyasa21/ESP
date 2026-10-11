/*
  AERIS · Dual-Mode Firmware (Option A + Option B)
  
  Supports:
  - Option A: SoftAP fallback ("ESP32-Gas-Monitor" at 192.168.4.1)
  - Option B: Home/College Wi-Fi (Station Mode) + mDNS (http://aeris.local)
  - Autonomous Hardware Safety: MQ-2 sensor loop and buzzer operate independently of network state.
  - CORS-enabled REST API: /api endpoint returns JSON for local/cloud dashboards.
*/

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>

// Hardware Pinout
const int PIN_MQ2_ADC   = 34;
const int PIN_LED_GREEN = 18;
const int PIN_LED_RED   = 19;
const int PIN_BUZZER    = 23;

// Alarm & Stabilization Limits
const int ALARM_THRESHOLD = 1800;           // Raw 12-bit ADC trip level (0 - 4095)
const unsigned long WARMUP_TIME_MS = 20000; // MQ-2 warmup stabilization delay

// Option B: Home / College Wi-Fi Credentials (leave empty or set your credentials)
const char* STA_SSID = "YOUR_WIFI_SSID";
const char* STA_PASS = "YOUR_WIFI_PASSWORD";

// Option A: Standalone Access Point Fallback
const char* AP_SSID = "ESP32-Gas-Monitor";
const char* AP_PASS = "GasMonitor123";

WebServer server(80);
unsigned long systemStartTime = 0;
bool isStationConnected = false;

void handleApi() {
  unsigned long now = millis();
  bool isReady = (now - systemStartTime) >= WARMUP_TIME_MS;
  
  // 8-sample oversampled ADC reading for stability
  long sum = 0;
  for (int i = 0; i < 8; i++) {
    sum += analogRead(PIN_MQ2_ADC);
    delayMicroseconds(200);
  }
  int adcValue = sum / 8;
  bool isAlarm = isReady && (adcValue >= ALARM_THRESHOLD);

  String json = "{";
  json += "\"adc\":" + String(adcValue) + ",";
  json += "\"threshold\":" + String(ALARM_THRESHOLD) + ",";
  json += "\"alarm\":" + String(isAlarm ? "true" : "false") + ",";
  json += "\"ready\":" + String(isReady ? "true" : "false") + ",";
  json += "\"green_led\":" + String((isReady && !isAlarm) ? "true" : "false") + ",";
  json += "\"red_led\":" + String(isAlarm ? "true" : "false") + ",";
  json += "\"buzzer\":" + String(isAlarm ? "true" : "false") + ",";
  json += "\"mode\":\"" + String(isStationConnected ? "STA" : "AP") + "\",";
  json += "\"ip\":\"" + (isStationConnected ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\",";
  json += "\"uptime\":" + String(now);
  json += "}";

  // Critical CORS & cache-busting headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.send(200, "application/json", json);
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>"
                "<title>AERIS · ESP32</title><style>body{font-family:-apple-system,sans-serif;padding:2rem;text-align:center;color:#111;background:#fff;}"
                "h2{margin-bottom:0.25rem}p{color:#6b7280;font-size:0.9rem}a{color:#a85968}</style></head>"
                "<body><h2>AERIS Gas Monitor</h2><p>ESP32 REST API live at <a href='/api'>/api</a></p>"
                "<p>Access via mDNS: <strong>http://aeris.local/api</strong></p></body></html>";
  server.send(200, "text/html", html);
}

void setup() {
  Serial.begin(115200);
  systemStartTime = millis();

  pinMode(PIN_MQ2_ADC, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Attempt Option B: Station Mode
  bool tryStation = (strlen(STA_SSID) > 0 && strcmp(STA_SSID, "YOUR_WIFI_SSID") != 0);

  if (tryStation) {
    Serial.print("Connecting to router: ");
    Serial.println(STA_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(STA_SSID, STA_PASS);

    unsigned long startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 8000) {
      delay(300);
      Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      isStationConnected = true;
      Serial.print("Connected! LAN IP: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("Router connection failed. Falling back to SoftAP Mode.");
    }
  }

  // If station not connected, fallback to Option A (SoftAP)
  if (!isStationConnected) {
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.print("SoftAP Active: ");
    Serial.println(AP_SSID);
    Serial.print("AP IP: ");
    Serial.println(WiFi.softAPIP());
  }

  // Start mDNS service: responds to http://aeris.local
  if (MDNS.begin("aeris")) {
    Serial.println("mDNS responder started: http://aeris.local");
  }

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api", HTTP_GET, handleApi);
  server.begin();
  Serial.println("HTTP Server running.");
}

void loop() {
  server.handleClient();

  // NON-NEGOTIABLE SAFETY RULE:
  // Autonomous Hardware Detection & Alarm.
  // Buzzer and Red LED run locally without dependency on network or browser state.
  unsigned long now = millis();
  bool isReady = (now - systemStartTime) >= WARMUP_TIME_MS;
  int adc = analogRead(PIN_MQ2_ADC);
  bool alarmActive = isReady && (adc >= ALARM_THRESHOLD);

  if (!isReady) {
    // Warm-up indication: slow green flash (1Hz)
    digitalWrite(PIN_LED_GREEN, (now / 500) % 2);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (alarmActive) {
    // Local Critical Alarm
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
  } else {
    // Normal operation
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  }

  delay(20);
}
