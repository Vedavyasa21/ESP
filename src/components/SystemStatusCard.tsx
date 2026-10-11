import React from 'react';
import { ShieldCheck, Flame, WifiOff, Clock } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface SystemStatusCardProps {
  alarm: boolean;
  ready: boolean;
  connectionStatus: ConnectionStatus;
  adc?: number | null;
  threshold?: number;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  alarm,
  ready,
  connectionStatus,
  adc,
  threshold = 1800,
}) => {
  // Determine primary state
  if (connectionStatus === 'offline') {
    return (
      <div className="bg-aeris-surface border border-aeris-border rounded-xl p-5 shadow-xs transition-all">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-white border border-aeris-border text-aeris-secondary shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-gray-400"></span>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-aeris-primary">
                Device Offline
              </h3>
            </div>
            <p className="mt-1 text-xs text-aeris-secondary leading-relaxed">
              Unable to retrieve telemetry. Ensure device is powered and connected to Wi-Fi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-5 shadow-xs transition-all">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-white border border-amber-200 text-amber-700 shrink-0">
            <Clock className="w-4 h-4 animate-spin text-amber-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-950">
                Sensor Heater Warming Up
              </h3>
            </div>
            <p className="mt-1 text-xs text-amber-900/80 leading-relaxed font-sans">
              MQ-2 internal heating coil is stabilizing (30s cycle). Telemetry values are logged but alarms are disarmed during warm-up.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (alarm) {
    return (
      <div className="bg-red-50/70 border border-red-300 rounded-xl p-5 shadow-xs transition-all relative overflow-hidden animate-pulse">
        <div className="flex items-start space-x-3.5 relative z-10">
          <div className="p-2.5 rounded-lg bg-white border border-red-200 text-red-600 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-red-600"></span>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-red-950">
                Critical Alarm · Gas Threshold Exceeded
              </h3>
            </div>
            <p className="mt-1 text-xs text-red-900 leading-relaxed font-sans">
              Gas sensor reading {adc !== null && adc !== undefined ? `(${adc} ADC)` : ''} has crossed the trip limit of {threshold} ADC. Local hardware buzzer and Red LED active.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal safe monitoring state
  return (
    <div className="bg-aeris-surface border border-aeris-border rounded-xl p-5 shadow-xs transition-all">
      <div className="flex items-start space-x-3.5">
        <div className="p-2.5 rounded-lg bg-white border border-aeris-border text-emerald-700 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-aeris-primary">
              Normal Monitoring · Safe
            </h3>
          </div>
          <p className="mt-1 text-xs text-aeris-secondary leading-relaxed font-sans">
            Sensor readings are steady below the configured warning threshold. Green status LED active.
          </p>
        </div>
      </div>
    </div>
  );
};
