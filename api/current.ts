import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // @ts-ignore
  const record = globalThis.__aeris_latest_telemetry;
  if (!record) {
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

  const age = Date.now() - new Date(record.updatedAt).getTime();
  return res.status(200).json({
    ...record,
    deviceOnline: age < 12000,
  });
}
