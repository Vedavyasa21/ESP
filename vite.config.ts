import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Lightweight in-memory state for local Vite dev testing of /api
let latestTelemetry: any = null;
const telemetryHistory: any[] = [];
const telemetryEvents: any[] = [];

const localApiPlugin = (): Plugin => ({
  name: 'aeris-local-api',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }

      if (req.url?.startsWith('/api/telemetry')) {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const now = new Date().toISOString();
              latestTelemetry = {
                ...data,
                updatedAt: now,
                deviceOnline: true,
              };
              telemetryHistory.push({
                timestamp: now,
                adc: data.adc,
                threshold: data.threshold,
              });
              if (telemetryHistory.length > 60) telemetryHistory.shift();

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, receivedAt: now }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(latestTelemetry || { adc: 1248, threshold: 1800, ready: true, alarm: false }));
          return;
        }
      }

      if (req.url?.startsWith('/api/current') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        if (!latestTelemetry) {
          res.end(JSON.stringify({
            adc: 1248,
            pinVoltage: 1.01,
            sensorVoltage: 1.61,
            threshold: 1800,
            thresholdLow: 1650,
            alarm: false,
            ready: true,
            updatedAt: new Date().toISOString(),
            deviceOnline: false,
          }));
        } else {
          const age = Date.now() - new Date(latestTelemetry.updatedAt).getTime();
          res.end(JSON.stringify({
            ...latestTelemetry,
            deviceOnline: age < 6000,
          }));
        }
        return;
      }

      if (req.url?.startsWith('/api/events') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ events: telemetryEvents }));
        return;
      }

      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    port: 3000,
    host: true, // Allow connections from phone/local network
    proxy: {
      '/esp-proxy': {
        target: 'http://192.168.4.1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/esp-proxy/, ''),
      },
    },
  },
});
