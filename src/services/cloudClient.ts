import { ESPTelemetry, AlarmEvent } from '../types';

/**
 * Cloud API Client for AERIS Serverless / Node.js Backend
 * Enables HTTPS remote monitoring without mixed-content browser restrictions.
 */

export async function fetchCloudCurrent(
  baseUrl: string,
  deviceId: string,
  timeoutMs: number = 3000
): Promise<ESPTelemetry> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}/api/devices/${encodeURIComponent(deviceId)}/current?_cb=${Date.now()}`;

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
      throw new Error(`Cloud API HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      adc: Number(data.adc),
      threshold: Number(data.threshold),
      alarm: Boolean(data.alarm),
      ready: Boolean(data.ready),
      deviceId: data.deviceId,
      uptime: data.uptimeMs,
      updatedAt: data.updatedAt,
      deviceOnline: Boolean(data.deviceOnline),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCloudEvents(
  baseUrl: string,
  deviceId: string
): Promise<AlarmEvent[]> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}/api/devices/${encodeURIComponent(deviceId)}/events?_cb=${Date.now()}`;

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
