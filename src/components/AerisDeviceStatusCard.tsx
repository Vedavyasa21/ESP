import React from 'react';
import {
  Smartphone,
  Wifi,
  BarChart2,
  Clock,
  Cpu,
  Activity,
  MapPin,
  CircleDot,
  Volume2,
} from 'lucide-react';
import { ConnectionStatus } from '../types';

interface AerisDeviceStatusCardProps {
  connectionStatus: ConnectionStatus;
  uptimeSeconds?: number;
  rssi?: number;
  onOpenSettings?: () => void;
}

export const AerisDeviceStatusCard: React.FC<AerisDeviceStatusCardProps> = ({
  connectionStatus,
  uptimeSeconds = 8076, // 2h 14m 36s
  rssi = -48,
  onOpenSettings,
}) => {
  const isOnline = connectionStatus === 'connected';

  // Format uptime into e.g. "2h 14m 36s"
  const formatUptime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = Math.floor(totalSec % 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const statusRows = [
    {
      icon: Wifi,
      label: 'Wi-Fi Connection',
      value: isOnline ? 'Connected' : 'Disconnected',
      isHighlight: true,
      highlightColor: isOnline ? 'text-[#4E8168]' : 'text-gray-400',
    },
    {
      icon: BarChart2,
      label: 'Signal Strength',
      value: `${rssi} dBm`,
    },
    {
      icon: Clock,
      label: 'Uptime',
      value: formatUptime(uptimeSeconds),
    },
    {
      icon: Cpu,
      label: 'Device',
      value: 'ESP32 DevKit',
    },
    {
      icon: Activity,
      label: 'Sensor',
      value: 'MQ-2',
    },
    {
      icon: MapPin,
      label: 'ADC Input',
      value: 'GPIO 34',
    },
    {
      icon: CircleDot,
      label: 'Green LED',
      value: 'GPIO 18',
    },
    {
      icon: CircleDot,
      label: 'Red LED',
      value: 'GPIO 19',
    },
    {
      icon: Volume2,
      label: 'Buzzer',
      value: 'GPIO 23',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-aeris-border p-6 sm:p-7 shadow-card flex flex-col justify-between select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
        <div className="flex items-center space-x-2.5">
          <Smartphone className="w-4 h-4 text-aeris-textSecondary" />
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1A1D20]">
            Device Status
          </span>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="text-[10px] font-bold text-aeris-textSecondary hover:text-[#1A1D20] cursor-pointer transition-colors uppercase tracking-wider"
          >
            Config ⚙
          </button>
        )}
      </div>

      {/* 9 Rows */}
      <div className="divide-y divide-[#F7F4EE] my-1">
        {statusRows.map((row, idx) => {
          const Icon = row.icon;
          return (
            <div
              key={idx}
              className="flex items-center justify-between py-2 text-xs transition-colors hover:bg-[#FAF8F4]/50 rounded-lg px-1"
            >
              <div className="flex items-center space-x-2.5 text-aeris-textSecondary">
                <Icon className="w-3.5 h-3.5 stroke-[1.8] text-aeris-textMuted" />
                <span className="font-medium text-[#4A4F55]">{row.label}</span>
              </div>
              <span
                className={`font-semibold tabular-nums ${
                  row.isHighlight ? row.highlightColor : 'text-[#1A1D20]'
                }`}
              >
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
