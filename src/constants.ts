import { DevicePinInfo } from './types';

export const DEFAULT_ESP32_CONFIG = {
  endpoint: 'http://192.168.4.1/api',
  pollIntervalMs: 1000,
  maxSamples: 60,
  adcResolution: 4095, // 12-bit ADC (0 - 4095)
  defaultThreshold: 1800,
  staleTimeoutMs: 3500, // Mark reading as stale if no update for 3.5s
  maxConsecutiveErrors: 3, // Mark offline after 3 consecutive failed fetches
};

export const DEVICE_HARDWARE_INFO: DevicePinInfo = {
  device: 'ESP32 DevKit V1',
  sensor: 'MQ-2 Semiconductor Gas Sensor',
  adcPin: 'GPIO 34 (Analog In / ADC1_CH6)',
  greenLedPin: 'GPIO 18 (Digital Out / Normal State)',
  redLedPin: 'GPIO 19 (Digital Out / Alarm State)',
  buzzerPin: 'GPIO 23 (Digital Out / Active Buzzer)',
  ssid: 'ESP32-Gas-Monitor',
  defaultIp: '192.168.4.1',
};
