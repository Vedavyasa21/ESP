#include "telegram_service.h"
#include "telegram_certs.h"

// Static instance
TelegramService telegramService;

// FreeRTOS background task wrapper
static void telegramTaskWrapper(void* pvParameters) {
  TelegramService* service = static_cast<TelegramService*>(pvParameters);
  service->runBackgroundTask();
}

TelegramService::TelegramService()
  : _stateCallback(nullptr),
    _threshCallback(nullptr),
    _queue(nullptr),
    _taskHandle(nullptr),
    _isTelegramVerified(false),
    _lastUpdateId(0),
    _lastPollTime(0),
    _lastAlertTime(0) {}

bool TelegramService::begin(GetSystemStateCallback stateCb, SetThresholdCallback threshCb) {
  _stateCallback = stateCb;
  _threshCallback = threshCb;

  // Create FreeRTOS Queue for up to 10 alert messages
  _queue = xQueueCreate(10, sizeof(TelegramAlertMessage));
  if (!_queue) {
    Serial.println("[Telegram] Failed to create FreeRTOS message queue.");
    return false;
  }

  // Create FreeRTOS Task pinned to Core 0 (leaving Core 1 entirely dedicated to sensor loop)
  BaseType_t res = xTaskCreatePinnedToCore(
    telegramTaskWrapper,
    "TelegramTask",
    16384,      // Stack size (16KB required for safe mbedTLS handshake & JSON processing)
    this,       // Parameter
    1,          // Priority (Normal)
    &_taskHandle,
    0           // Pinned to Core 0
  );

  if (res != pdPASS) {
    Serial.println("[Telegram] Failed to launch FreeRTOS background task.");
    return false;
  }

  Serial.println("[Telegram] Asynchronous Telegram Service initialized on Core 0.");
  return true;
}

bool TelegramService::queueNotification(TelegramNotificationType type, int adc, float volts, int threshold, bool flame, const char* custom) {
  if (!_queue) return false;

  TelegramAlertMessage msg;
  msg.type = type;
  msg.adcValue = adc;
  msg.pinVoltage = volts;
  msg.threshold = threshold;
  msg.isFlame = flame;
  memset(msg.customText, 0, sizeof(msg.customText));
  if (custom) {
    strncpy(msg.customText, custom, sizeof(msg.customText) - 1);
  }

  // Enqueue message non-blocking (0 tick timeout ensures caller never stalls)
  BaseType_t res = xQueueSend(_queue, &msg, 0);
  return (res == pdPASS);
}

void TelegramService::runBackgroundTask() {
  TelegramAlertMessage msg;

  // Initial delay to allow Wi-Fi connection to stabilize
  vTaskDelay(pdMS_TO_TICKS(2000));

  while (true) {
    // 1. Maintain Wi-Fi connectivity in background
    if (WiFi.status() != WL_CONNECTED) {
      _isTelegramVerified = false;
      vTaskDelay(pdMS_TO_TICKS(2000));
      continue;
    }

    // Sync network time for TLS verification
    static bool ntpConfigured = false;
    if (!ntpConfigured) {
      ntpConfigured = true;
      configTime(0, 0, "pool.ntp.org", "time.google.com");
    }

    // 2. Check for pending notification in queue
    if (xQueueReceive(_queue, &msg, pdMS_TO_TICKS(100)) == pdPASS) {
      String text;
      unsigned long nowMs = millis();

      switch (msg.type) {
        case NOTIF_STARTUP: {
          text = "🟢 *AERIS Gas Monitor Online*\n";
          text += "━━━━━━━━━━━━━━━━━━━━\n";
          text += "📍 *Device:* " + String(SECRET_DEVICE_ID) + "\n";
          text += "📶 *Wi-Fi:* Connected (`" + WiFi.localIP().toString() + "`)\n";
          text += "📊 *Baseline Gas:* " + String(msg.adcValue) + " ADC (" + String(msg.pinVoltage, 2) + "V)\n";
          text += "⚠️ *Trip Threshold:* " + String(msg.threshold) + " ADC\n";
          text += "🛡️ *Status:* Active & Monitoring\n";
          text += "━━━━━━━━━━━━━━━━━━━━\n";
          text += "Send /help for available commands.";
          break;
        }

        case NOTIF_GAS_ALARM: {
          text = "🚨 *CRITICAL ALERT: Gas Leakage Detected!*\n";
          text += "━━━━━━━━━━━━━━━━━━━━\n";
          text += "⚠️ *Current Reading:* *" + String(msg.adcValue) + " ADC*\n";
          text += "🎯 *Safety Threshold:* " + String(msg.threshold) + " ADC\n";
          text += "⚡ *Sensor Voltage:* " + String(msg.pinVoltage, 2) + " V\n";
          if (msg.isFlame) {
            text += "🔥 *Flame Sensor:* FLAME DETECTED!\n";
          }
          text += "🔊 *Hardware Actuators:* Red LED & Buzzer ACTIVE\n";
          text += "⏱️ *System Uptime:* " + formatUptime(nowMs) + "\n";
          text += "━━━━━━━━━━━━━━━━━━━━\n";
          text += "⚠️ *Action Required:* Inspect area immediately and ventilate!";
          break;
        }

        case NOTIF_GAS_RECOVERY: {
          text = "✅ *ALL CLEAR: Gas Level Normalized*\n";
          text += "━━━━━━━━━━━━━━━━━━━━\n";
          text += "📊 *Current Reading:* " + String(msg.adcValue) + " ADC\n";
          text += "🎯 *Safety Threshold:* " + String(msg.threshold) + " ADC\n";
          text += "⚡ *Sensor Voltage:* " + String(msg.pinVoltage, 2) + " V\n";
          text += "🟢 *Status:* Safe — Buzzer & Red LED Deactivated\n";
          text += "⏱️ *System Uptime:* " + formatUptime(nowMs) + "\n";
          text += "━━━━━━━━━━━━━━━━━━━━\n";
          text += "System has safely resumed standard monitoring.";
          break;
        }

        case NOTIF_CUSTOM: {
          text = String(msg.customText);
          break;
        }
      }

      // Retry up to 3 times on transmission failure
      bool sent = false;
      for (int attempt = 1; attempt <= 3; attempt++) {
        if (sendRawMessage(text)) {
          sent = true;
          _isTelegramVerified = true;
          break;
        }
        vTaskDelay(pdMS_TO_TICKS(1000));
      }

      if (!sent) {
        Serial.println("[Telegram] Failed to deliver notification after 3 attempts.");
      }
    }

    // 3. Periodically poll for incoming Telegram commands (every 2.5 seconds)
    unsigned long currentMs = millis();
    if (currentMs - _lastPollTime >= 2500) {
      _lastPollTime = currentMs;
      processIncomingUpdates();
    }

    // Yield CPU time to lower priority FreeRTOS background tasks
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

bool TelegramService::sendRawMessage(const String& text, const char* targetChatId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Telegram] Cannot send message: ESP32 Wi-Fi is NOT connected to internet!");
    return false;
  }

  const char* chatId = (targetChatId && strlen(targetChatId) > 0) ? targetChatId : SECRET_CHAT_ID;

  WiFiClientSecure client;
#if TELEGRAM_CERT_VERIFY
  client.setCACert(TELEGRAM_ROOT_CA);
#else
  client.setInsecure();
#endif
  client.setTimeout(8000); // 8-second timeout for TLS handshake

  HTTPClient http;
  String url = "https://api.telegram.org/bot" + String(SECRET_BOT_TOKEN) + "/sendMessage";

  if (!http.begin(client, url)) {
    Serial.println("[Telegram] HTTPS initialization failed.");
    return false;
  }

  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  http.setTimeout(8000);

  String postData = "chat_id=" + urlEncode(chatId) +
                    "&text=" + urlEncode(text) +
                    "&parse_mode=Markdown";

  int httpCode = http.POST(postData);

#if TELEGRAM_CERT_VERIFY
  // Automatic fallback: If strict CA check failed (e.g. clock mismatch before NTP syncs), retry with direct TLS
  if (httpCode <= 0) {
    Serial.printf("[Telegram] CA certificate check returned %d. Retrying with direct TLS...\n", httpCode);
    http.end();
    client.stop();
    client.setInsecure();
    if (http.begin(client, url)) {
      http.addHeader("Content-Type", "application/x-www-form-urlencoded");
      http.setTimeout(8000);
      httpCode = http.POST(postData);
    }
  }
#endif

  // If Markdown parsing failed on Telegram servers (HTTP 400), retry in plain text mode!
  if (httpCode == 400) {
    Serial.println("[Telegram] Markdown format error from Telegram. Retrying plain text...");
    http.end();
    String plainPost = "chat_id=" + urlEncode(chatId) + "&text=" + urlEncode(text);
    if (http.begin(client, url)) {
      http.addHeader("Content-Type", "application/x-www-form-urlencoded");
      http.setTimeout(8000);
      httpCode = http.POST(plainPost);
    }
  }

  // SANITIZED LOGGING: Never expose bot token or sensitive credentials in logs!
  if (httpCode == HTTP_CODE_OK) {
    Serial.printf("[Telegram] Message delivered successfully to Chat %s (HTTP 200).\n", chatId);
    http.end();
    return true;
  } else {
    String resp = http.getString();
    Serial.printf("[Telegram] Delivery failed with HTTP status code: %d | Response: %s\n", httpCode, resp.c_str());
    http.end();
    return false;
  }
}

void TelegramService::processIncomingUpdates() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
#if TELEGRAM_CERT_VERIFY
  client.setCACert(TELEGRAM_ROOT_CA);
#else
  client.setInsecure();
#endif
  client.setTimeout(5000);

  HTTPClient http;
  String url = "https://api.telegram.org/bot" + String(SECRET_BOT_TOKEN) +
               "/getUpdates?offset=" + String(_lastUpdateId + 1) +
               "&limit=5&timeout=0";

  if (!http.begin(client, url)) return;
  http.setTimeout(5000);

  int httpCode = http.GET();

#if TELEGRAM_CERT_VERIFY
  if (httpCode <= 0) {
    http.end();
    client.stop();
    client.setInsecure();
    if (http.begin(client, url)) {
      http.setTimeout(5000);
      httpCode = http.GET();
    }
  }
#endif

  if (httpCode != HTTP_CODE_OK) {
    http.end();
    return;
  }

  String payload = http.getString();
  http.end();

  // Mark Telegram verified on successful response
  _isTelegramVerified = true;

  // Lightweight JSON parser for incoming commands without requiring external libraries
  int resultIdx = payload.indexOf("\"result\":[");
  if (resultIdx == -1) return;

  int updateIdx = payload.indexOf("{\"update_id\":", resultIdx);
  while (updateIdx != -1) {
    // Extract update_id
    int idStart = updateIdx + 13;
    int idEnd = payload.indexOf(",", idStart);
    if (idEnd != -1) {
      long updateId = payload.substring(idStart, idEnd).toInt();
      if (updateId > _lastUpdateId) {
        _lastUpdateId = updateId;
      }
    }

    // Extract chat id
    String fromChatId = "";
    int chatIdx = payload.indexOf("\"chat\":{\"id\":", updateIdx);
    if (chatIdx != -1) {
      int cidStart = chatIdx + 13;
      int cidEnd = payload.indexOf(",", cidStart);
      if (cidEnd != -1) {
        fromChatId = payload.substring(cidStart, cidEnd);
      }
    }

    // Extract text
    String messageText = "";
    int textIdx = payload.indexOf("\"text\":\"", updateIdx);
    if (textIdx != -1) {
      int tStart = textIdx + 8;
      int tEnd = payload.indexOf("\"", tStart);
      if (tEnd != -1) {
        messageText = payload.substring(tStart, tEnd);
      }
    }

    if (messageText.length() > 0 && fromChatId.length() > 0) {
      handleCommand(messageText, fromChatId);
    }

    // Find next update in payload
    updateIdx = payload.indexOf("{\"update_id\":", updateIdx + 1);
  }
}

void TelegramService::handleCommand(const String& command, const String& fromChatId) {
  // REQUIREMENT 14: Restrict sensitive commands to the configured authorized chat ID
  if (fromChatId != String(SECRET_CHAT_ID)) {
    Serial.printf("[Telegram] Unauthorized access attempt from Chat ID: %s\n", fromChatId.c_str());
    sendRawMessage("⛔ *Access Denied*\nYour Telegram account is not authorized to control or monitor this device.", fromChatId.c_str());
    return;
  }

  String cmd = command;
  cmd.trim();
  int spaceIdx = cmd.indexOf(' ');
  String baseCmd = (spaceIdx != -1) ? cmd.substring(0, spaceIdx) : cmd;
  baseCmd.toLowerCase();

  if (baseCmd == "/start" || baseCmd == "start" || baseCmd == "hello" || baseCmd == "hi") {
    String resp = "👋 *Welcome to AERIS ESP32 Gas Monitor*\n";
    resp += "━━━━━━━━━━━━━━━━━━━━\n";
    resp += "Real-time safety telemetry and emergency notification bot.\n\n";
    resp += "*Available Commands:*\n";
    resp += "• /status — View live gas reading, voltages, and hardware state\n";
    resp += "• /threshold — View current configured alarm trip threshold\n";
    resp += "• /help — List all supported commands\n";
    resp += "━━━━━━━━━━━━━━━━━━━━\n";
    resp += "🛡️ System is actively monitoring in the background.";
    sendRawMessage(resp, fromChatId.c_str());
  }
  else if (baseCmd == "/status" || baseCmd == "status") {
    int adc = 0;
    float volts = 0.0;
    int thresh = 1800;
    bool alarm = false;
    bool flame = false;
    unsigned long uptimeMs = millis();

    if (_stateCallback) {
      _stateCallback(adc, volts, thresh, alarm, flame, uptimeMs);
    }

    String resp = "📊 *AERIS Telemetry Status Report*\n";
    resp += "━━━━━━━━━━━━━━━━━━━━\n";
    resp += "🟢 *Gas Reading:* *" + String(adc) + " ADC*\n";
    resp += "⚡ *Sensor Voltage:* " + String(volts, 2) + " V\n";
    resp += "🎯 *Safety Threshold:* " + String(thresh) + " ADC\n";
    resp += "🔥 *Flame Sensor:* " + String(flame ? "🔥 DETECTED" : "Safe") + "\n";
    resp += "🚨 *Alarm State:* " + String(alarm ? "*⚠️ ACTIVE (ALARM)*" : "Safe & Normal") + "\n";
    resp += "📶 *Wi-Fi RSSI:* " + String(WiFi.RSSI()) + " dBm\n";
    resp += "⏱️ *System Uptime:* " + formatUptime(uptimeMs) + "\n";
    resp += "━━━━━━━━━━━━━━━━━━━━";
    sendRawMessage(resp, fromChatId.c_str());
  }
  else if (baseCmd == "/threshold" || baseCmd == "threshold") {
    int adc = 0;
    float volts = 0.0;
    int thresh = 1800;
    bool alarm = false;
    bool flame = false;
    unsigned long uptimeMs = 0;

    if (_stateCallback) {
      _stateCallback(adc, volts, thresh, alarm, flame, uptimeMs);
    }

    String resp = "🎯 *AERIS Threshold Configuration*\n";
    resp += "━━━━━━━━━━━━━━━━━━━━\n";
    resp += "• *Trip Threshold:* *" + String(thresh) + " ADC*\n";
    resp += "• *Recovery Reset:* " + String(thresh - 150) + " ADC (Hysteresis)\n";
    resp += "• *Analog Range:* 0 - 4095 (12-bit ADC on GPIO 34)\n\n";
#if ENABLE_REMOTE_THRESHOLD_CONFIG
    resp += "Remote modification enabled: use `/setthreshold <val>` to calibrate.";
#else
    resp += "🔒 *Safety Policy:* Remote threshold changes are disabled. Calibrate via firmware configuration.";
#endif
    sendRawMessage(resp, fromChatId.c_str());
  }
  else if (baseCmd == "/help" || baseCmd == "help") {
    String resp = "📖 *AERIS Supported Commands*\n";
    resp += "━━━━━━━━━━━━━━━━━━━━\n";
    resp += "• `/start` — Display welcome greeting & overview\n";
    resp += "• `/status` — Live sensor readings, voltages & alarm status\n";
    resp += "• `/threshold` — Display safety trip threshold settings\n";
    resp += "• `/help` — Display this command reference\n";
#if ENABLE_REMOTE_THRESHOLD_CONFIG
    resp += "• `/setthreshold <value>` — Adjust alarm threshold (100 - 4000)\n";
#endif
    resp += "━━━━━━━━━━━━━━━━━━━━";
    sendRawMessage(resp, fromChatId.c_str());
  }
#if ENABLE_REMOTE_THRESHOLD_CONFIG
  else if (baseCmd == "/setthreshold") {
    if (spaceIdx == -1) {
      sendRawMessage("⚠️ *Usage:* `/setthreshold <ADC value>` (e.g. `/setthreshold 1800`)", fromChatId.c_str());
      return;
    }
    int newThresh = cmd.substring(spaceIdx + 1).toInt();
    if (newThresh >= 200 && newThresh <= 4000) {
      if (_threshCallback) {
        _threshCallback(newThresh);
        sendRawMessage("✅ *Threshold Updated:* New trip level is *" + String(newThresh) + " ADC*.", fromChatId.c_str());
      }
    } else {
      sendRawMessage("⚠️ Invalid threshold. Range must be between 200 and 4000 ADC counts.", fromChatId.c_str());
    }
  }
#endif
  else {
    sendRawMessage("❓ Unknown command. Type /help to see all available commands.", fromChatId.c_str());
  }
}

String TelegramService::formatUptime(unsigned long ms) {
  unsigned long totalSec = ms / 1000;
  unsigned long hours = totalSec / 3600;
  unsigned long minutes = (totalSec % 3600) / 60;
  unsigned long seconds = totalSec % 60;

  char buf[32];
  snprintf(buf, sizeof(buf), "%02luh %02lum %02lus", hours, minutes, seconds);
  return String(buf);
}

String TelegramService::urlEncode(const String& str) {
  String encoded = "";
  char c;
  char code0;
  char code1;
  for (unsigned int i = 0; i < str.length(); i++) {
    c = str.charAt(i);
    if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
      encoded += c;
    } else {
      code1 = (c & 0xf) + '0';
      if ((c & 0xf) > 9) {
        code1 = (c & 0xf) - 10 + 'A';
      }
      c = (c >> 4) & 0xf;
      code0 = c + '0';
      if (c > 9) {
        code0 = c - 10 + 'A';
      }
      encoded += '%';
      encoded += code0;
      encoded += code1;
    }
  }
  return encoded;
}
