# AERIS · ESP32 Gas Monitoring System

A minimal, industrial-tech embedded gas detection and monitoring system for **ESP32 + MQ-2**.

---

## 1. System Architecture

```
[MQ-2 Sensor] ──(GPIO 34 ADC)──┐
                               ▼
                    [ESP32 Hardware Core]
                    - Autonomous Sampling (20ms)
                    - Threshold Alarm (1800 ADC)
                    - Green LED (GPIO 18)
                    - Red LED (GPIO 19)
                    - Active Buzzer (GPIO 23)
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
    [Option A: Direct Wi-Fi AP]      [Option B & C: Wi-Fi Station]
    - SSID: ESP32-Gas-Monitor        - Router LAN Mode
    - IP: 192.168.4.1                - Outbound HTTPS POST (Bearer Token)
    - Local /api Endpoint            - mDNS: http://aeris.local
               │                               │
               │                               ▼
               │                     [Cloud Backend / Functions]
               │                     - POST /api/telemetry
               │                     - GET /api/devices/:id/current
               │                     - Deduplication & Cooldown (60s)
               │                     - FCM Web Push Dispatcher
               │                               │
               ▼                               ▼
    [React Mobile Dashboard] ◄─────────────────┘
    - Live 12-bit ADC Reading (Raw Counts)
    - 0–4095 Proportional Gauge
    - Rolling 60-sample Telemetry Chart
    - Inferred GPIO Actuators
    - Web Push & Audio Alerts (Web Audio API)
    - Deduplicated Alarm Events Log
```

---

## 2. Telemetry Data Protocols

### ESP32 ➔ Backend (`POST /api/telemetry`)
Dispatched every 2000ms using non-blocking `millis()` scheduling:
```json
{
  "deviceId": "aeris-esp32-01",
  "adc": 1248,
  "threshold": 1800,
  "ready": true,
  "alarm": false,
  "uptimeMs": 48320
}
```
**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_DEVICE_SPECIFIC_TOKEN`

### Backend ➔ Frontend (`GET /api/devices/:deviceId/current`)
```json
{
  "deviceId": "aeris-esp32-01",
  "adc": 1248,
  "threshold": 1800,
  "ready": true,
  "alarm": false,
  "uptimeMs": 48320,
  "updatedAt": "2026-10-10T16:20:00.000Z",
  "deviceOnline": true
}
```
*Note: `deviceOnline` is calculated based on the age of `updatedAt` (< 6000ms).*

---

## 3. Firmware Implementations

| Firmware File | Purpose |
| :--- | :--- |
| [`firmware/aeris_firmware/aeris_firmware.ino`](file:///C:/MyPersonalprojects/ESP/firmware/aeris_firmware/aeris_firmware.ino) | **Telegram Bot & Industrial Edition**: Asynchronous FreeRTOS Core 0 Telegram alerts (TLS Go Daddy Root CA G2 verified), edge-triggered gas leak alerts, all-clear recovery notices, interactive `/status` and `/threshold` commands, local SoftAP + Station Wi-Fi, and 100% unblocked Core 1 sensor loops. |
| [`firmware/aeris_cloud_telemetry.ino`](file:///C:/MyPersonalprojects/ESP/firmware/aeris_cloud_telemetry.ino) | **Production Cloud Edition**: Connects to home/college router, dispatches outbound HTTPS POST telemetry with Bearer authentication, and keeps local hardware loop 100% unblocked. |
| [`firmware/aeris_dual_mode_firmware.ino`](file:///C:/MyPersonalprojects/ESP/firmware/aeris_dual_mode_firmware.ino) | **Dual-Mode LAN/AP Edition**: Connects to router with mDNS responder (`aeris.local`), with automatic fallback to SoftAP (`192.168.4.1`) if router is unavailable. |
| [`firmware/gas_leak_detection/gas_leak_detection.ino`](file:///C:/MyPersonalprojects/ESP/firmware/gas_leak_detection/gas_leak_detection.ino) | **Standalone Hardware Node**: Direct ADC sampling with 12k/20k divider voltage compensation and local LED/buzzer siren actuation. |

---

## 4. Telegram Bot Integration & Setup Guide

The AERIS ESP32 firmware features enterprise-grade Telegram alerting designed to ensure safety-critical hardware monitoring is never disrupted by network latency:

- **FreeRTOS Dual-Core Architecture**: Sensor reading and local alarms run on **Core 1**, while HTTPS/TLS requests to `api.telegram.org` run asynchronously on **Core 0**. If Wi-Fi disconnects or Telegram experiences latency, local alarms (Red LED, buzzer) still activate within milliseconds.
- **Hardware-Level TLS Verification**: Uses the Go Daddy Root CA G2 (`telegram_certs.h`) certificate to verify the Telegram API endpoint securely.
- **Edge-Triggered Notifications**:
  - `NOTIF_STARTUP`: Dispatched once when Wi-Fi and Telegram connectivity are confirmed.
  - `NOTIF_GAS_ALARM`: Dispatched immediately when gas crosses from below threshold to $\ge 1800\text{ ADC}$. Does NOT spam repeated alerts while continuously high.
  - `NOTIF_GAS_RECOVERY`: Dispatched when gas drops below the hysteresis threshold ($< 1650\text{ ADC}$).
- **Configurable Cooldown**: `TELEGRAM_COOLDOWN_SEC` rate-limits notifications if readings bounce near the threshold.
- **Interactive Bot Commands**:
  - `/start` — Welcome greeting and overview.
  - `/status` — Live gas ADC, voltage, threshold, flame sensor, and uptime telemetry.
  - `/threshold` — Current trip and clear thresholds.
  - `/help` — List of all supported commands.
- **Chat ID Authorization**: All commands from unauthorized chat IDs are rejected with access denied.
- **Secrets Security**: Wi-Fi credentials and bot tokens are stored in `secrets.h`, which is excluded by `.gitignore`.

### Telegram Bot Setup Instructions:

1. **Create or configure your Telegram Bot**:
   - Open Telegram and message [@BotFather](https://t.me/BotFather).
   - Use `/newbot` to create your bot, or use an existing bot.
   - Note the HTTP API token (e.g. `8877794189:AAEIEIzlLlT08wtZ1QkwaZPHgb134SBcUNc`).
2. **Authorize your Chat ID**:
   - Open Telegram and search for your bot (e.g. [@gasdetetcbot](https://t.me/gasdetetcbot)) and click **Start**.
   - Open [@userinfobot](https://t.me/userinfobot) or [@IDBot](https://t.me/IDBot) to find your numerical Telegram Chat ID (e.g. `123456789`).
3. **Configure `secrets.h`**:
   - In `firmware/aeris_firmware/`, copy `secrets.h.template` to `secrets.h` (if not already created):
     ```bash
     cp firmware/aeris_firmware/secrets.h.template firmware/aeris_firmware/secrets.h
     ```
   - Edit `firmware/aeris_firmware/secrets.h`:
     ```c
     #define SECRET_WIFI_SSID         "Your_WiFi_Name"
     #define SECRET_WIFI_PASS         "Your_WiFi_Password"
     #define SECRET_BOT_TOKEN         "8877794189:AAEIEIzlLlT08wtZ1QkwaZPHgb134SBcUNc"
     #define SECRET_CHAT_ID           "YOUR_CHAT_ID_HERE"
     #define TELEGRAM_CERT_VERIFY     1
     #define TELEGRAM_COOLDOWN_SEC    60
     ```
4. **Compile & Flash**:
   - In Arduino IDE, open `firmware/aeris_firmware/aeris_firmware.ino`.
   - Select Board: **ESP32 Dev Module** (`esp32:esp32:esp32`).
   - Click **Upload** and open the Serial Monitor at **115200 baud**.
5. **Testing Procedures**:
   - **Startup Test**: Once connected to Wi-Fi, verify that the bot sends the `🟢 AERIS Gas Monitor Online` startup message.
   - **Command Test**: Send `/status` and `/threshold` in the Telegram chat to verify two-way communication.
   - **Alarm Test**: Expose the MQ-2 sensor to gas (e.g. butane from an unlit lighter) to cross 1800 ADC. Verify that the Red LED and Buzzer sound locally and a `🚨 CRITICAL ALERT` Telegram notification is received.
   - **Recovery Test**: Ventilate the sensor until the ADC drops below 1650 counts. Verify that the hardware returns to safe state (Green LED solid, buzzer OFF) and an `✅ ALL CLEAR` recovery message is received.

---

## 4. Running the Stack

### 1. Frontend Dashboard (React + TypeScript + Vite)
```bash
npm install
npm run dev -- --host
```
Open `http://localhost:3000` or your network IP on mobile.
- **Preview Mode**: Test the interface with mock data and trigger simulated gas spikes.
- **Direct AP Mode**: Point directly to `http://192.168.4.1/api`.
- **Cloud Mode**: Point to your backend (e.g., `http://localhost:4000` or hosted Vercel/Firebase URL).

### 2. Cloud Backend (Node.js / Express / Firebase Functions)
```bash
cd backend
npm install
npm run dev
```
Listens on `http://localhost:4000`.

---

## 5. Verification Checklist

- [x] **Autonomous Alarm**: Hardware loops for GPIO 34, 18, 19, and 23 operate independently of network status.
- [x] **Wi-Fi Auto-Reconnect**: Outbound telemetry resumes automatically after network interruptions without blocking sensor sampling.
- [x] **Deduplication Cooldown**: Alarm transitions enforce a 60-second cooldown so continuous high readings do not spam notifications.
- [x] **Honest Offline Detection**: The dashboard calculates online status based on server timestamp age rather than trusting a stale flag.
- [x] **Mixed-Content Protection**: HTTPS-hosted dashboards query the cloud API rather than private local IPs.
- [x] **Web Push Notifications**: Service worker (`public/firebase-messaging-sw.js`) delivers background OS alerts.
