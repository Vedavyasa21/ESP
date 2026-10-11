export interface IncomingTelemetry {
  deviceId: string;
  adc: number;
  threshold: number;
  ready: boolean;
  alarm: boolean;
  uptimeMs: number;
}

export interface DeviceRecord {
  deviceId: string;
  adc: number;
  threshold: number;
  ready: boolean;
  alarm: boolean;
  uptimeMs: number;
  updatedAt: string; // Server-generated ISO timestamp
}

export interface DevicePublicState {
  deviceId: string;
  adc: number;
  threshold: number;
  ready: boolean;
  alarm: boolean;
  uptimeMs: number;
  updatedAt: string;
  deviceOnline: boolean; // Computed by server based on update age < 6s
}

export interface AlarmEvent {
  id: string;
  type: 'GAS_THRESHOLD_CROSSED' | 'ALARM_CLEARED';
  deviceId: string;
  adc: number;
  threshold: number;
  timestamp: string;
}

export interface RegisterPushTokenRequest {
  deviceId: string;
  token: string;
  platform?: string;
}
