/**
 * Telemetry payload from ESP32 or Cloud Backend
 */
export interface ESPTelemetry {
  adc: number;
  threshold: number;
  alarm: boolean;
  ready: boolean;
  
  // Analog Voltage & Calibration Signals
  pinVoltage?: number;
  sensorVoltage?: number;
  thresholdLow?: number;
  
  // Cloud & Extension Fields
  deviceId?: string;
  uptime?: number;
  uptimeMs?: number;
  updatedAt?: string;
  deviceOnline?: boolean;
  green_led?: boolean;
  red_led?: boolean;
  buzzer?: boolean;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'offline';

export type ConnectionMode = 'simulation' | 'direct_ap' | 'cloud' | 'usb_serial';

export type SystemAlarmState = 'normal' | 'alarm' | 'warming_up' | 'offline';

export interface InferredHardwareState {
  greenLed: {
    active: boolean;
    isInferred: boolean;
    note: string;
  };
  redLed: {
    active: boolean;
    isInferred: boolean;
    note: string;
  };
  buzzer: {
    active: boolean;
    isInferred: boolean;
    note: string;
  };
}

export interface ReadingHistoryPoint {
  id: string;
  timestamp: number;
  timeLabel: string;
  adc: number;
  threshold: number;
}

export interface AlarmEvent {
  id: string;
  type: 'GAS_THRESHOLD_CROSSED' | 'ALARM_CLEARED';
  deviceId: string;
  adc: number;
  threshold: number;
  timestamp: string;
}

export interface DevicePinInfo {
  device: string;
  sensor: string;
  adcPin: string;
  greenLedPin: string;
  redLedPin: string;
  buzzerPin: string;
  ssid: string;
  defaultIp: string;
}

export interface ClientConfig {
  endpoint: string;
  cloudEndpoint: string;
  deviceId: string;
  mode: ConnectionMode;
  pollIntervalMs: number;
  maxHistorySamples: number;
}
