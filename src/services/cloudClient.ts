import { ESPTelemetry, AlarmEvent } from '../types';

/**
 * Cloud API Client for AERIS Serverless / Node.js Backend
 * Enables HTTPS remote monitoring without mixed-content browser restrictions.
 */

export async function fetchCloudCurrent(
  baseUrl: string,
  deviceId?: string,
  timeoutMs: number = 3000
): Promise<ESPTelemetry> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const cleanBase = baseUrl ? baseUrl.replace(/\/+$/, '') : '';
  const query = `_cb=${Date.now()}${deviceId ? `&deviceId=${encodeURIComponent(deviceId)}` : ''}`;
  const url = cleanBase ? `${cleanBase}/api/telemetry?${query}` : `/api/telemetry?${query}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      // Fallback attempt to /api/current if /api/telemetry is unavailable
      const fallbackUrl = cleanBase ? `${cleanBase}/api/current?${query}` : `/api/current?${query}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
        signal: controller.signal,
      });
      if (!fallbackRes.ok) {
        throw new Error(`Cloud API HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await fallbackRes.json();
      return parseCloudData(data, deviceId);
    }

    const data = await res.json();
    return parseCloudData(data, deviceId);
  } finally {
    clearTimeout(timer);
  }
}

function parseCloudData(data: any, defaultDeviceId?: string): ESPTelemetry {
  const adc = Number(data.adc ?? data.val ?? 842);
  const threshold = Number(data.threshold ?? 1800);
  const thresholdLow = Number(data.thresholdLow ?? 1650);
  const pinVoltage = typeof data.pinVoltage === 'number' ? data.pinVoltage : Number(((adc / 4095) * 3.3).toFixed(2));
  const sensorVoltage = typeof data.sensorVoltage === 'number' ? data.sensorVoltage : Number((pinVoltage / 0.625).toFixed(2));

  return {
    adc,
    threshold,
    thresholdLow,
    pinVoltage,
    sensorVoltage,
    alarm: Boolean(data.alarm),
    ready: data.ready !== undefined ? Boolean(data.ready) : true,
    deviceId: data.deviceId || defaultDeviceId || 'AERIS-01',
    uptime: data.uptimeMs ?? data.uptime ?? 0,
    uptimeMs: data.uptimeMs ?? data.uptime ?? 0,
    updatedAt: data.updatedAt,
    deviceOnline: Boolean(data.deviceOnline),
    green_led: Boolean(data.green_led),
    red_led: Boolean(data.red_led),
    buzzer: Boolean(data.buzzer),
  };
}

export async function fetchCloudEvents(
  baseUrl: string,
  _deviceId?: string
): Promise<AlarmEvent[]> {
  const cleanBase = baseUrl ? baseUrl.replace(/\/+$/, '') : '';
  const url = cleanBase ? `${cleanBase}/api/events?_cb=${Date.now()}` : `/api/events?_cb=${Date.now()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.events) ? data.events : [];
  } catch {
    return [];
  }
}

export async function registerPushToken(
  baseUrl: string,
  deviceId: string,
  token: string
): Promise<boolean> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}/api/notifications/register`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId, token }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
