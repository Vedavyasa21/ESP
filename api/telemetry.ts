import type { VercelRequest, VercelResponse } from '@vercel/node';

// Global telemetry state across serverless function invocations (warm instances)
declare global {
  // eslint-disable-next-line no-var
  var __aeris_latest_telemetry: any;
  // eslint-disable-next-line no-var
  var __aeris_history: any[];
  // eslint-disable-next-line no-var
  var __aeris_events: any[];
}

globalThis.__aeris_latest_telemetry = globalThis.__aeris_latest_telemetry || null;
globalThis.__aeris_history = globalThis.__aeris_history || [];
globalThis.__aeris_events = globalThis.__aeris_events || [];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Allow permissive CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const data = req.body;
    const rawVal = typeof data?.adc === 'number' ? data.adc : typeof data?.val === 'number' ? data.val : null;
    if (rawVal === null) {
      return res.status(400).json({ error: 'Missing adc or val value' });
    }

    const now = new Date().toISOString();
    const prevAlarm = globalThis.__aeris_latest_telemetry?.alarm || false;
    const isAlarm = Boolean(data.alarm);

    const record = {
      deviceId: data.deviceId || 'AERIS-01',
      adc: Math.round(rawVal),
      val: Math.round(rawVal),
      pinVoltage: typeof data.pinVoltage === 'number' ? Number(data.pinVoltage.toFixed(2)) : Number(((rawVal / 4095) * 3.3).toFixed(2)),
      sensorVoltage: typeof data.sensorVoltage === 'number' ? Number(data.sensorVoltage.toFixed(2)) : Number((((rawVal / 4095) * 3.3) / 0.625).toFixed(2)),
      threshold: typeof data.threshold === 'number' ? Math.round(data.threshold) : 1800,
      thresholdLow: typeof data.thresholdLow === 'number' ? Math.round(data.thresholdLow) : 1650,
      alarm: isAlarm,
      ready: Boolean(data.ready),
      green_led: Boolean(data.green_led),
      red_led: Boolean(data.red_led),
      buzzer: Boolean(data.buzzer),
      uptimeMs: data.uptimeMs || data.uptime || 0,
      updatedAt: now,
      deviceOnline: true,
    };

    globalThis.__aeris_latest_telemetry = record;

    // Append to rolling history
    globalThis.__aeris_history.push({
      timestamp: now,
      adc: record.adc,
      pinVoltage: record.pinVoltage,
      threshold: record.threshold,
    });
    if (globalThis.__aeris_history.length > 60) {
      globalThis.__aeris_history.shift();
    }

    // Alarm transition logging
    if (!prevAlarm && isAlarm) {
      globalThis.__aeris_events.unshift({
        id: `${Date.now()}-alarm`,
        type: 'GAS_THRESHOLD_CROSSED',
        adc: record.adc,
        threshold: record.threshold,
        timestamp: now,
      });
    } else if (prevAlarm && !isAlarm) {
      globalThis.__aeris_events.unshift({
        id: `${Date.now()}-clear`,
        type: 'ALARM_CLEARED',
        adc: record.adc,
        threshold: record.threshold,
        timestamp: now,
      });
    }

    return res.status(200).json({ success: true, receivedAt: now });
  }

  // GET: return latest reading
  if (req.method === 'GET') {
    if (!globalThis.__aeris_latest_telemetry) {
      return res.status(200).json({
        adc: 1248,
        val: 1248,
        pinVoltage: 1.01,
        sensorVoltage: 1.61,
        threshold: 1800,
        thresholdLow: 1650,
        alarm: false,
        ready: true,
        updatedAt: new Date().toISOString(),
        deviceOnline: false,
        isSimulatedFallback: true,
      });
    }

    const age = Date.now() - new Date(globalThis.__aeris_latest_telemetry.updatedAt).getTime();
    return res.status(200).json({
      ...globalThis.__aeris_latest_telemetry,
      deviceOnline: age < 12000,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
