/*
  AERIS · ESP32 + MQ-2 Industrial Gas Monitoring Firmware
  
  Hardware Pinout:
  - MQ-2 Analog AOUT: GPIO 34 (ADC1_CH6)
  - Green LED (Normal): GPIO 18
  - Red LED (Alarm): GPIO 19
  - Active Buzzer: GPIO 23
  
  Wi-Fi Access Point:
  - SSID: ESP32-Gas-Monitor
  - Password: GasMonitor123
  - Default IP: 192.168.4.1
  - JSON API: http://192.168.4.1/api
*/

#include <WiFi.h>
#include <WebServer.h>

// Pin Definitions
const int PIN_MQ2_ADC   = 34;
const int PIN_LED_GREEN = 18;
const int PIN_LED_RED   = 19;
const int PIN_BUZZER    = 23;

// Sensor & Alarm Parameters
const int ALARM_THRESHOLD = 1800;          // ADC Counts trip level (0-4095)
const unsigned long WARMUP_TIME_MS = 20000; // 20s initial stabilization for demo (normally 60-180s)

// AP Credentials
const char* AP_SSID = "ESP32-Gas-Monitor";
const char* AP_PASS = "GasMonitor123";

WebServer server(80);
unsigned long systemStartTime = 0;

void handleApi() {
  unsigned long now = millis();
  bool isReady = (now - systemStartTime) >= WARMUP_TIME_MS;
  
  // Read 12-bit ADC (average of 8 samples for stability)
  long sum = 0;
  for (int i = 0; i < 8; i++) {
    sum += analogRead(PIN_MQ2_ADC);
    delayMicroseconds(250);
  }
  int adcValue = sum / 8;
  
  bool isAlarm = isReady && (adcValue >= ALARM_THRESHOLD);

  // Construct JSON response matching AERIS specification
  String json = "{";
  json += "\"adc\":" + String(adcValue) + ",";
  json += "\"threshold\":" + String(ALARM_THRESHOLD) + ",";
  json += "\"alarm\":" + String(isAlarm ? "true" : "false") + ",";
  json += "\"ready\":" + String(isReady ? "true" : "false") + ",";
  json += "\"green_led\":" + String((isReady && !isAlarm) ? "true" : "false") + ",";
  json += "\"red_led\":" + String(isAlarm ? "true" : "false") + ",";
  json += "\"buzzer\":" + String(isAlarm ? "true" : "false") + ",";
  json += "\"uptime\":" + String(now);
  json += "}";

  // Critical CORS headers to allow browser fetch from any client
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.send(200, "application/json", json);
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>AERIS ESP32</title></head>"
                "<body style='font-family:sans-serif;padding:2rem;text-align:center;'>"
                "<h2>AERIS Gas Monitor AP</h2>"
                "<p>API endpoint live at <a href='/api'>/api</a></p>"
                "</body></html>";
  server.send(200, "text/html", html);
}

void setup() {
  Serial.begin(115200);
  systemStartTime = millis();

  // GPIO Modes
  pinMode(PIN_MQ2_ADC, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Initial State: LEDs & Buzzer Off
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Configure Wi-Fi Access Point
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS);

  IPAddress myIP = WiFi.softAPIP();
  Serial.print("AERIS AP Started: ");
  Serial.println(AP_SSID);
  Serial.print("Access Point IP: ");
  Serial.println(myIP);

  // Set WebServer Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api", HTTP_GET, handleApi);
  server.begin();
  Serial.println("HTTP Server active.");
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  bool isReady = (now - systemStartTime) >= WARMUP_TIME_MS;
  int adcValue = analogRead(PIN_MQ2_ADC);
  bool isAlarm = isReady && (adcValue >= ALARM_THRESHOLD);

  // Local Autonomous Hardware Control (works even without browser connected)
  if (!isReady) {
    // Warming up: blink green LED slowly
    digitalWrite(PIN_LED_GREEN, (now / 500) % 2);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (isAlarm) {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
  } else {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  }

  delay(20);
}
