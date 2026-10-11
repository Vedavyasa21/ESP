#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// Check for local secrets file
#if __has_include("secrets.h")
  #include "secrets.h"
#else
  #error "Configuration file 'secrets.h' not found! Please copy 'secrets.h.template' to 'secrets.h' and fill in your Wi-Fi and Telegram Bot credentials."
#endif

enum TelegramNotificationType {
  NOTIF_STARTUP,
  NOTIF_GAS_ALARM,
  NOTIF_GAS_RECOVERY,
  NOTIF_CUSTOM
};

struct TelegramAlertMessage {
  TelegramNotificationType type;
  int adcValue;
  float pinVoltage;
  int threshold;
  bool isFlame;
  char customText[160];
};

// Callback signature for querying live system telemetry from main loop
typedef void (*GetSystemStateCallback)(int& outAdc, float& outVolts, int& outThreshold, bool& outAlarm, bool& outFlame, unsigned long& outUptimeMs);
// Callback signature for updating threshold (if enabled)
typedef void (*SetThresholdCallback)(int newThreshold);

class TelegramService {
public:
  TelegramService();

  // Initialize service, FreeRTOS queue, and background task
  bool begin(GetSystemStateCallback stateCb, SetThresholdCallback threshCb = nullptr);

  // Non-blocking notification dispatcher (called from main sensor loop)
  // Enqueues message into FreeRTOS queue and returns immediately (< 1us)
  bool queueNotification(TelegramNotificationType type, int adc, float volts, int threshold, bool flame, const char* custom = nullptr);

  // Check if Telegram service is currently connected and ready
  bool isConnected() const { return _isTelegramVerified; }

  // Internal FreeRTOS task entry point
  void runBackgroundTask();

private:
  GetSystemStateCallback _stateCallback;
  SetThresholdCallback _threshCallback;
  QueueHandle_t _queue;
  TaskHandle_t _taskHandle;
  bool _isTelegramVerified;
  long _lastUpdateId;
  unsigned long _lastPollTime;
  unsigned long _lastAlertTime;

  // Internal HTTPS communications
  bool sendRawMessage(const String& text, const char* targetChatId = nullptr);
  void processIncomingUpdates();
  void handleCommand(const String& command, const String& fromChatId);
  String formatUptime(unsigned long ms);
  String urlEncode(const String& str);
};

extern TelegramService telegramService;
