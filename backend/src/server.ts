import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  IncomingTelemetry,
  DeviceRecord,
  DevicePublicState,
  AlarmEvent,
  RegisterPushTokenRequest,
} from './types.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// -----------------------------------------------------------------------------
// In-Memory Data Store (Easily bound to Firestore / Realtime DB in production)
// -----------------------------------------------------------------------------
const EXPECTED_DEVICE_TOKEN = process.env.DEVICE_TOKEN || 'YOUR_DEVICE_SPECIFIC_TOKEN';
const ONLINE_THRESHOLD_MS = 6000; // 6 seconds before marked offline
const NOTIFICATION_COOLDOWN_MS = 60000; // 60 seconds deduplication cooldown

const deviceStates = new Map<string, DeviceRecord>();
const deviceHistories = new Map<string, { timestamp: string; adc: number; threshold: number }[]>();
const deviceEvents = new Map<string, AlarmEvent[]>();
const pushTokens = new Map<string, Set<string>>();
const lastNotificationSentAt = new Map<string, number>();

// -----------------------------------------------------------------------------
// Mock FCM Push Sender (Uses Firebase Admin SDK when credentials are configured)
// -----------------------------------------------------------------------------
async function dispatchPushNotification(deviceId: string, event: AlarmEvent) {
  const tokens = pushTokens.get(deviceId);
  if (!tokens || tokens.size === 0) {
    console.log(`[FCM] No registered push tokens for device: ${deviceId}`);
    return;
  }

  console.log(`[FCM PUSH] Triggering push to ${tokens.size} client(s) for ${deviceId}:`, {
    title: 'AERIS Warning — Sensor Threshold Exceeded',
    body: `MQ-2 sensor triggered alarm at ${event.adc} ADC (Threshold: ${event.threshold})`,
  });

  // If FIREBASE_SERVICE_ACCOUNT is available, firebase-admin sends native push here:
  /*
  const payload = {
    notification: {
      title: 'AERIS Warning — Sensor Threshold Exceeded',
      body: `MQ-2 sensor triggered alarm at ${event.adc} ADC (Threshold: ${event.threshold})`,
    },
    data: {
      deviceId,
      adc: String(event.adc),
      type: event.type,
      timestamp: event.timestamp,
    },
  };
  await admin.messaging().sendEachForMulticast({ tokens: Array.from(tokens), ...payload });
  */
}

// -----------------------------------------------------------------------------
// 1. POST /api/telemetry (ESP32 Ingestion Endpoint)
// -----------------------------------------------------------------------------
app.post('/api/telemetry', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring(7);
  // Authenticate token (allows default in development)
  if (token !== EXPECTED_DEVICE_TOKEN && EXPECTED_DEVICE_TOKEN !== 'YOUR_DEVICE_SPECIFIC_TOKEN') {
    return res.status(403).json({ error: 'Unauthorized device credential' });
  }

  const data = req.body as IncomingTelemetry;

  // Schema Validation
  if (
    !data.deviceId ||
    typeof data.adc !== 'number' ||
    typeof data.threshold !== 'number' ||
    typeof data.ready !== 'boolean' ||
    typeof data.alarm !== 'boolean'
  ) {
    return res.status(400).json({ error: 'Malformed telemetry JSON schema' });
  }

  // Range validation
  if (data.adc < 0 || data.adc > 4095 || data.threshold < 0 || data.threshold > 4095) {
    return res.status(400).json({ error: 'ADC values must be within 12-bit range (0 - 4095)' });
  }

  const now = new Date();
  const serverTimestamp = now.toISOString();
  const previousState = deviceStates.get(data.deviceId);

  const newRecord: DeviceRecord = {
    deviceId: data.deviceId,
    adc: Math.round(data.adc),
    threshold: Math.round(data.threshold),
    ready: data.ready,
    alarm: data.alarm,
    uptimeMs: data.uptimeMs || 0,
    updatedAt: serverTimestamp,
  };

  deviceStates.set(data.deviceId, newRecord);

  // Append to rolling history (max 60 points)
  let history = deviceHistories.get(data.deviceId) || [];
  history.push({
    timestamp: serverTimestamp,
    adc: newRecord.adc,
    threshold: newRecord.threshold,
  });
  if (history.length > 60) {
    history = history.slice(history.length - 60);
  }
  deviceHistories.set(data.deviceId, history);

  // Alarm Transition Detection & Deduplication Cooldown
  const transitionedToAlarm = (!previousState || !previousState.alarm) && data.alarm;
  const transitionedToSafe = previousState?.alarm && !data.alarm;

  if (transitionedToAlarm) {
    const lastAlertTime = lastNotificationSentAt.get(data.deviceId) || 0;
    const cooldownElapsed = Date.now() - lastAlertTime >= NOTIFICATION_COOLDOWN_MS;

    const alarmEvent: AlarmEvent = {
      id: `${Date.now()}-alarm`,
      type: 'GAS_THRESHOLD_CROSSED',
      deviceId: data.deviceId,
      adc: newRecord.adc,
      threshold: newRecord.threshold,
      timestamp: serverTimestamp,
    };

    let events = deviceEvents.get(data.deviceId) || [];
    events.unshift(alarmEvent);
    if (events.length > 30) events = events.slice(0, 30);
    deviceEvents.set(data.deviceId, events);

    if (cooldownElapsed) {
      lastNotificationSentAt.set(data.deviceId, Date.now());
      await dispatchPushNotification(data.deviceId, alarmEvent);
    } else {
      console.log(`[DEDUPLICATION] Notification suppressed by cooldown for ${data.deviceId}`);
    }
  } else if (transitionedToSafe) {
    const clearEvent: AlarmEvent = {
      id: `${Date.now()}-cleared`,
      type: 'ALARM_CLEARED',
      deviceId: data.deviceId,
      adc: newRecord.adc,
      threshold: newRecord.threshold,
      timestamp: serverTimestamp,
    };
    let events = deviceEvents.get(data.deviceId) || [];
    events.unshift(clearEvent);
    deviceEvents.set(data.deviceId, events);
  }

  return res.status(200).json({
    success: true,
    receivedAt: serverTimestamp,
  });
});

// -----------------------------------------------------------------------------
// 2. GET /api/devices/:deviceId/current (Live State for React Frontend)
// -----------------------------------------------------------------------------
app.get('/api/devices/:deviceId/current', (req: Request, res: Response) => {
  const deviceId = String(req.params.deviceId);
  const record = deviceStates.get(deviceId);

  if (!record) {
    return res.status(404).json({
      error: `Device '${deviceId}' not found or has not reported telemetry yet`,
      deviceOnline: false,
    });
  }

  const ageMs = Date.now() - new Date(record.updatedAt).getTime();
  const deviceOnline = ageMs < ONLINE_THRESHOLD_MS;

  const publicState: DevicePublicState = {
    ...record,
    deviceOnline,
  };

  return res.status(200).json(publicState);
});

// -----------------------------------------------------------------------------
// 3. GET /api/devices/:deviceId/history (Historical Samples)
// -----------------------------------------------------------------------------
app.get('/api/devices/:deviceId/history', (req: Request, res: Response) => {
  const deviceId = String(req.params.deviceId);
  const history = deviceHistories.get(deviceId) || [];
  return res.status(200).json({ deviceId, samples: history });
});

// -----------------------------------------------------------------------------
// 4. GET /api/devices/:deviceId/events (Alarm Transitions)
// -----------------------------------------------------------------------------
app.get('/api/devices/:deviceId/events', (req: Request, res: Response) => {
  const deviceId = String(req.params.deviceId);
  const events = deviceEvents.get(deviceId) || [];
  return res.status(200).json({ deviceId, events });
});

// -----------------------------------------------------------------------------
// 5. POST /api/notifications/register (FCM Token Registration)
// -----------------------------------------------------------------------------
app.post('/api/notifications/register', (req: Request, res: Response) => {
  const { deviceId, token } = req.body as RegisterPushTokenRequest;

  if (!deviceId || !token) {
    return res.status(400).json({ error: 'deviceId and token are required' });
  }

  let tokens = pushTokens.get(deviceId);
  if (!tokens) {
    tokens = new Set<string>();
    pushTokens.set(deviceId, tokens);
  }

  tokens.add(token);
  console.log(`[FCM] Registered token for device: ${deviceId}`);

  return res.status(200).json({
    success: true,
    message: 'Push subscription registered successfully',
  });
});

// -----------------------------------------------------------------------------
// Root Health Check
// -----------------------------------------------------------------------------
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'AERIS Gas Monitoring Backend',
    version: '1.0.0',
    status: 'ONLINE',
    devicesTracked: deviceStates.size,
  });
});

// Export app for Firebase Functions / Serverless
export default app;

// If started as standalone server:
const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[AERIS Backend] Server listening on http://localhost:${PORT}`);
  });
}
