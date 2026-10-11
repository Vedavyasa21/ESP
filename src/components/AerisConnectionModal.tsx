import React, { useState } from 'react';
import {
  X,
  Wifi,
  Usb,
  Radio,
  Sparkles,
  Check,
  Copy,
  Cpu,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ConnectionMode, ConnectionStatus, ESPTelemetry } from '../types';

interface AerisConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ConnectionMode;
  connectionStatus: ConnectionStatus;
  telemetry: ESPTelemetry;
  cloudEndpoint: string;
  deviceId: string;
  onSelectMode: (newMode: ConnectionMode) => void;
  onConnectUsb: () => void;
  onSaveCloudConfig?: (cloudEndpoint: string, deviceId: string) => void;
}

export const AerisConnectionModal: React.FC<AerisConnectionModalProps> = ({
  isOpen,
  onClose,
  mode,
  connectionStatus,
  telemetry,
  cloudEndpoint,
  deviceId,
  onSelectMode,
  onConnectUsb,
  onSaveCloudConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'wifi' | 'usb' | 'ap' | 'simulation'>(
    mode === 'usb_serial' ? 'usb' : mode === 'direct_ap' ? 'ap' : mode === 'cloud' ? 'wifi' : 'wifi'
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [editEndpoint, setEditEndpoint] = useState(cloudEndpoint || 'https://gasdetection.vercel.app');
  const [editDeviceId, setEditDeviceId] = useState(deviceId || 'AERIS-01');

  if (!isOpen) return null;

  const isCloudOnline = mode === 'cloud' && Boolean(telemetry.deviceOnline);
  const isUsbOnline = mode === 'usb_serial' && connectionStatus === 'connected';
  const cleanEndpoint = editEndpoint.trim().replace(/\/+$/, '');
  const telemetryUrl = `${cleanEndpoint}/api/telemetry`;

  const arduinoWifiSnippet = `// === AERIS ESP32 WI-FI CLOUD SENDER ===
// Flash this code to your ESP32 in Arduino IDE!
#include <WiFi.h>
#include <WebServer.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// Option 1: Mobile Hotspot (Turn on hotspot on your phone!)
const char* ssid     = "ESP32_HOTSPOT";  // Wi-Fi Name
const char* password = "password123";    // Wi-Fi Password

// Option 2: ESP32 Access Point (Always active at 192.168.4.1!)
const char* ap_ssid  = "ESP32_GAS_ALERT";
const char* ap_pass  = "12345678";

const char* api_url  = "${telemetryUrl}";

#define PIN_MQ2_ADC 34
#define PIN_LED_GREEN 18
#define PIN_LED_RED 19
#define PIN_BUZZER 23
const int THRESHOLD = 1800;

WebServer server(80);
int currentVal = 0;

void handleApi() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\\"val\\":" + String(currentVal) + ",\\"threshold\\":1800}");
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_MQ2_ADC, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  analogReadResolution(12);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(ap_ssid, ap_pass); // Starts http://192.168.4.1
  WiFi.begin(ssid, password);    // Connects to phone hotspot

  server.on("/api", HTTP_GET, handleApi);
  server.begin();
  Serial.println("Wi-Fi Started! AP: ESP32_GAS_ALERT (192.168.4.1)");
}

void loop() {
  server.handleClient();
  long sum = 0;
  for (int i = 0; i < 15; i++) { sum += analogRead(PIN_MQ2_ADC); delay(4); }
  currentVal = sum / 15;
  bool isAlarm = (currentVal >= THRESHOLD);

  digitalWrite(PIN_LED_RED, isAlarm ? HIGH : LOW);
  digitalWrite(PIN_LED_GREEN, isAlarm ? LOW : HIGH);
  digitalWrite(PIN_BUZZER, isAlarm ? HIGH : LOW);

  // Serial Monitor Output
  Serial.printf("[READING] val: %d | Status: %s\\n", currentVal, isAlarm ? "ALARM" : "SAFE");

  // Post to Vercel Cloud
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure();
    client.setTimeout(2500);

    HTTPClient http;
    if (http.begin(client, api_url)) {
      http.addHeader("Content-Type", "application/json");
      String json = "{\\"deviceId\\":\\"${editDeviceId}\\",\\"adc\\":" + String(currentVal) +
                    ",\\"val\\":" + String(currentVal) +
                    ",\\"threshold\\":" + String(THRESHOLD) +
                    ",\\"alarm\\":" + String(isAlarm ? "true" : "false") +
                    ",\\"ready\\":true}";
      http.POST(json);
      http.end();
    }
  }
  delay(1500);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(arduinoWifiSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${editEndpoint.replace(/\/+$/, '')}/api/telemetry`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleActivateWifiCloud = () => {
    if (onSaveCloudConfig) {
      onSaveCloudConfig(editEndpoint, editDeviceId);
    }
    onSelectMode('cloud');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-fade-in select-none">
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#E5DFD5] shadow-2xl max-w-2xl w-full overflow-hidden text-[#1A1D20] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#ECE6DC] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EFF5F1] text-[#4E8168] flex items-center justify-center">
              <Cpu className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#1A1D20]">
                ESP32 Hardware Connection Hub
              </h2>
              <p className="text-xs text-[#8A8F95] font-medium">
                Choose how your ESP32 streams telemetry to this dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A8F95] hover:text-[#1A1D20] hover:bg-[#F2EDE4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 bg-[#EDE8DF] p-1.5 mx-6 mt-5 rounded-2xl shrink-0 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('wifi')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'wifi'
                ? 'bg-white text-[#1A1D20] shadow-sm'
                : 'text-[#6C7177] hover:text-[#1A1D20]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-[#4E8168]" />
            <span className="hidden sm:inline">Wi-Fi Cloud</span>
            <span className="sm:hidden">Wi-Fi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usb')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'usb'
                ? 'bg-white text-[#1A1D20] shadow-sm'
                : 'text-[#6C7177] hover:text-[#1A1D20]'
            }`}
          >
            <Usb className="w-3.5 h-3.5 text-[#356396]" />
            <span className="hidden sm:inline">USB Serial</span>
            <span className="sm:hidden">USB</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ap')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'ap'
                ? 'bg-white text-[#1A1D20] shadow-sm'
                : 'text-[#6C7177] hover:text-[#1A1D20]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#C97A3E]" />
            <span className="hidden sm:inline">Local SoftAP</span>
            <span className="sm:hidden">SoftAP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-white text-[#1A1D20] shadow-sm'
                : 'text-[#6C7177] hover:text-[#1A1D20]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8854D0]" />
            <span className="hidden sm:inline">Simulation</span>
            <span className="sm:hidden">Sim</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: WI-FI CLOUD SYNC */}
          {activeTab === 'wifi' && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isCloudOnline
                    ? 'bg-[#EFF5F1] border-[#CDE3D5] text-[#2F6146]'
                    : mode === 'cloud'
                    ? 'bg-[#FFF9EE] border-[#F2E0BD] text-[#8C6219]'
                    : 'bg-white border-[#E6E0D4] text-[#4A4F55]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isCloudOnline
                        ? 'bg-[#4E8168] animate-pulse shadow-[0_0_8px_rgba(78,129,104,0.8)]'
                        : mode === 'cloud'
                        ? 'bg-[#E5A038] animate-pulse'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div>
                    <div className="font-extrabold text-xs">
                      {isCloudOnline
                        ? 'ESP32 Wi-Fi is Live & Streaming Telemetry!'
                        : mode === 'cloud'
                        ? 'Listening on Vercel... Waiting for ESP32 ping'
                        : 'Wi-Fi Cloud Sync Ready to Connect'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {isCloudOnline
                        ? `Live reading: ${telemetry.adc} ADC · Status: ${telemetry.alarm ? '🚨 ALARM' : 'Safe'}`
                        : 'Connect ESP32 to your home/mobile hotspot Wi-Fi to transmit telemetry to Vercel.'}
                    </div>
                  </div>
                </div>

                {mode !== 'cloud' ? (
                  <button
                    onClick={handleActivateWifiCloud}
                    className="px-4 py-2 rounded-xl bg-[#4E8168] hover:bg-[#3E6A54] text-white font-extrabold transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    Enable Wi-Fi Mode
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-white/70 font-bold text-[10px] uppercase tracking-wider shrink-0 border border-current">
                    Active Mode
                  </span>
                )}
              </div>

              {/* Endpoint Details */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6E0D4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1A1D20]">Vercel Cloud Ingestion Endpoint:</span>
                  <button
                    onClick={handleCopyUrl}
                    className="text-[11px] text-[#4E8168] font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied!' : 'Copy API URL'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-[#8A8F95] mb-1">
                      API Base URL
                    </label>
                    <input
                      type="text"
                      value={editEndpoint}
                      onChange={(e) => setEditEndpoint(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F5F0] border border-[#EBE5DB] font-mono text-[11px] text-[#1A1D20] font-bold focus:outline-none focus:border-[#4E8168]"
                      placeholder="https://gasdetection.vercel.app"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8A8F95] mb-1">
                      Device ID
                    </label>
                    <input
                      type="text"
                      value={editDeviceId}
                      onChange={(e) => setEditDeviceId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F5F0] border border-[#EBE5DB] font-mono text-[11px] text-[#1A1D20] font-bold focus:outline-none focus:border-[#4E8168]"
                      placeholder="AERIS-01"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#6C7177] leading-relaxed">
                  The ESP32 sends HTTP POST requests to{' '}
                  <code className="bg-[#F2EDE4] px-1.5 py-0.5 rounded text-[#1A1D20] font-mono">
                    {editEndpoint.replace(/\/+$/, '')}/api/telemetry
                  </code>
                  . The Vercel dashboard automatically updates in real-time from anywhere in the world!
                </div>
              </div>

              {/* 3-Step Setup Guide */}
              <div className="bg-white p-5 rounded-2xl border border-[#E6E0D4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#1A1D20] text-xs uppercase tracking-wider">
                    Quick ESP32 Setup (3 Steps)
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#EFF5F1] text-[#4E8168] hover:bg-[#E3EDE6] font-bold transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Code Copied!' : 'Copy Arduino Sketch'}</span>
                  </button>
                </div>

                {/* Pre-configured Credentials Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#F7F5F0] border border-[#EBE5DB]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#8A8F95] uppercase block">
                      1. Mobile Phone Hotspot:
                    </span>
                    <div className="text-[11px] font-mono text-[#1A1D20]">
                      SSID: <strong>ESP32_HOTSPOT</strong><br />
                      Password: <strong>password123</strong> (2.4 GHz)
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#8A8F95] uppercase block">
                      2. ESP32 Direct Hotspot:
                    </span>
                    <div className="text-[11px] font-mono text-[#1A1D20]">
                      SSID: <strong>ESP32_GAS_ALERT</strong><br />
                      Password: <strong>12345678</strong> (IP: 192.168.4.1)
                    </div>
                  </div>
                </div>

                <ol className="list-decimal list-inside space-y-2 text-[#4A4F55] leading-relaxed pl-1 text-[11.5px]">
                  <li>
                    In <strong>Arduino IDE</strong>, open file{' '}
                    <code className="bg-[#F2EDE4] px-1.5 py-0.5 rounded text-[#1A1D20] font-mono">
                      firmware/aeris_esp32_wifi_val/aeris_esp32_wifi_val.ino
                    </code>{' '}
                    (or click <strong>Copy Arduino Sketch</strong> above).
                  </li>
                  <li>
                    Turn on your phone's personal hotspot with name <strong>ESP32_HOTSPOT</strong> and password <strong>password123</strong> (or use your own router credentials).
                  </li>
                  <li>
                    Click <strong>Upload</strong> in Arduino IDE. The ESP32 will immediately print live gas values (val) to the Serial Monitor and stream them to this website!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: USB SERIAL (COM PORT) */}
          {activeTab === 'usb' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isUsbOnline
                    ? 'bg-[#EFF5F1] border-[#CDE3D5] text-[#2F6146]'
                    : 'bg-white border-[#E6E0D4] text-[#4A4F55]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isUsbOnline
                        ? 'bg-[#4E8168] animate-pulse shadow-[0_0_8px_rgba(78,129,104,0.8)]'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div>
                    <div className="font-extrabold text-xs">
                      {isUsbOnline ? 'USB Serial Connected (COM8 Active)' : 'USB Serial Ready'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {isUsbOnline
                        ? `Live reading: ${telemetry.adc} ADC · Web Serial 115200 Baud`
                        : 'Plug in ESP32 via USB cable and stream directly without any Wi-Fi setup.'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onConnectUsb();
                    onClose();
                  }}
                  className={`px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer shrink-0 shadow-sm ${
                    isUsbOnline
                      ? 'bg-[#2F6146] text-white hover:bg-[#254F38]'
                      : 'bg-[#1A1D20] text-white hover:bg-black'
                  }`}
                >
                  {isUsbOnline ? 'Reconnect USB' : 'Connect via USB'}
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E6E0D4] space-y-3 leading-relaxed text-[#4A4F55]">
                <h4 className="font-extrabold text-[#1A1D20] text-xs uppercase tracking-wider">
                  How USB Serial Works:
                </h4>
                <p>
                  Web Serial API connects your browser directly to your ESP32's micro-USB / USB-C port at <strong>115200 baud</strong>.
                  No internet connection or router required.
                </p>
                <div className="p-3 bg-[#EFF5F1] border border-[#D5E4D9] rounded-xl flex items-start space-x-2 text-[#2D563E]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-[11px]">
                    Supported on Chromium browsers (Google Chrome, Microsoft Edge, Opera, Brave). On macOS/Windows/Linux.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOCAL SOFTAP (192.168.4.1) */}
          {activeTab === 'ap' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E6E0D4] space-y-3 leading-relaxed text-[#4A4F55]">
                <div className="flex items-center space-x-2 text-[#C97A3E]">
                  <Radio className="w-5 h-5" />
                  <h4 className="font-extrabold text-[#1A1D20] text-sm">
                    ESP32 Direct Wi-Fi Hotspot (SoftAP)
                  </h4>
                </div>
                <p>
                  In this mode, the ESP32 broadcasts its own Wi-Fi network named <strong>ESP32_GAS_ALERT</strong> (Password: <strong>12345678</strong>, IP: <code className="bg-[#F2EDE4] px-1 rounded font-mono">192.168.4.1</code>).
                </p>
                <div className="p-3 bg-[#FFF8EE] border border-[#F0DDC0] rounded-xl flex items-start space-x-2 text-[#8C5D1F]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-[11px]">
                    <strong>Note for Vercel HTTPS:</strong> Browsers block direct HTTP requests to local IPs like <code>192.168.4.1</code> from secure HTTPS websites. For remote viewing on Vercel, please use <strong>Wi-Fi Cloud mode</strong> or access the ESP32 directly via your phone/laptop browser at{' '}
                    <a
                      href="http://192.168.4.1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold"
                    >
                      http://192.168.4.1
                    </a>.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onSelectMode('direct_ap');
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#C97A3E] hover:bg-[#B36932] text-white font-extrabold transition-all cursor-pointer shadow-sm"
                  >
                    Switch to Direct AP Mode (192.168.4.1)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SIMULATION */}
          {activeTab === 'simulation' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E6E0D4] space-y-3 leading-relaxed text-[#4A4F55]">
                <div className="flex items-center space-x-2 text-[#8854D0]">
                  <Sparkles className="w-5 h-5" />
                  <h4 className="font-extrabold text-[#1A1D20] text-sm">
                    Interactive Demonstration Simulator
                  </h4>
                </div>
                <p>
                  Demonstrate the full AERIS Gas Leakage platform without requiring any physical ESP32 or sensors connected.
                  You can toggle safe values (842 ADC) or trigger real hazard alarms (2260 ADC) with industrial sound alerts.
                </p>
                <button
                  onClick={() => {
                    onSelectMode('simulation');
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#8854D0] hover:bg-[#7442B8] text-white font-extrabold transition-all cursor-pointer shadow-sm"
                >
                  Activate Demo Simulator Mode
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#ECE6DC] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#8A8F95]">
            Current mode: <strong className="text-[#1A1D20] uppercase font-bold">{mode}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#EDE8DF] hover:bg-[#E2DDD3] text-[#1A1D20] font-extrabold transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
