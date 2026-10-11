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
| [`firmware/aeris_cloud_telemetry.ino`](file:///C:/MyPersonalprojects/ESP/firmware/aeris_cloud_telemetry.ino) | **Production Cloud Edition**: Connects to home/college router, dispatches outbound HTTPS POST telemetry with Bearer authentication, and keeps local hardware loop 100% unblocked. |
| [`firmware/aeris_dual_mode_firmware.ino`](file:///C:/MyPersonalprojects/ESP/firmware/aeris_dual_mode_firmware.ino) | **Dual-Mode LAN/AP Edition**: Connects to router with mDNS responder (`aeris.local`), with automatic fallback to SoftAP (`192.168.4.1`) if router is unavailable. |
| [`firmware/aeris_firmware.ino`](file:///C:/MyPersonalprojects/ESP/firmware/aeris_firmware.ino) | **Standalone SoftAP Edition**: Direct AP mode with local `/api` REST endpoint. |

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
