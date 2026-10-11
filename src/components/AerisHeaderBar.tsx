import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Usb, Wifi } from 'lucide-react';
import { ConnectionStatus, ConnectionMode } from '../types';

interface AerisHeaderBarProps {
  connectionStatus: ConnectionStatus;
  mode?: ConnectionMode;
  isCloudOnline?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenConnectionModal?: () => void;
  onOpenNotifications?: () => void;
  onConnectUsb?: () => void;
  onSelectMode?: (mode: ConnectionMode) => void;
  unreadAlertsCount?: number;
}

export const AerisHeaderBar: React.FC<AerisHeaderBarProps> = ({
  connectionStatus,
  mode = 'simulation',
  isCloudOnline = false,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onOpenConnectionModal,
  onOpenNotifications,
  onConnectUsb,
  onSelectMode,
  unreadAlertsCount = 1,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const isOnline =
    mode === 'cloud'
      ? isCloudOnline
      : mode === 'usb_serial'
      ? connectionStatus === 'connected'
      : connectionStatus === 'connected';

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full flex items-center justify-between pb-6 pt-1 select-none">
      {/* Left Title & System Subtitle */}
      <div className="flex items-center space-x-4">
        <span className="font-extrabold text-xl tracking-[0.25em] text-[#1A1D20]">
          AERIS
        </span>
        <span className="text-[#D4CEC4] font-light text-lg">|</span>
        <span className="text-xs font-semibold tracking-[0.18em] text-aeris-textSecondary uppercase">
          ESP32 Gas Monitoring System
        </span>
      </div>

      {/* Right Controls, Connection Pill & Clock */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Wi-Fi Cloud Direct Connect Quick Action */}
        <button
          onClick={() => {
            if (mode !== 'cloud') {
              onSelectMode?.('cloud');
            } else {
              onOpenConnectionModal?.();
            }
          }}
          title={
            mode === 'cloud'
              ? isCloudOnline
                ? 'Wi-Fi Cloud Sync Active (Online)'
                : 'Wi-Fi Cloud Sync Active (Waiting for ESP32...)'
              : 'Switch to Wi-Fi Cloud Sync'
          }
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
            mode === 'cloud'
              ? isCloudOnline
                ? 'bg-[#EFF5F1] text-[#4E8168] border-[#DFECE3]'
                : 'bg-[#FFF9EE] text-[#9E6E1D] border-[#F2E0BD]'
              : 'bg-white text-aeris-textSecondary border-aeris-border hover:text-[#1A1D20]'
          }`}
        >
          <Wifi className="w-3.5 h-3.5 stroke-[2]" />
          <span>
            {mode === 'cloud'
              ? isCloudOnline
                ? 'Wi-Fi Live'
                : 'Wi-Fi (Wait)'
              : 'Wi-Fi'}
          </span>
          {mode === 'cloud' && (
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isCloudOnline ? 'bg-[#4E8168] animate-pulse' : 'bg-[#E5A038]'
              }`}
            />
          )}
        </button>

        {/* USB Direct Connect Quick Action */}
        {onConnectUsb && (
          <button
            onClick={() => {
              if (mode !== 'usb_serial') {
                onConnectUsb();
              } else {
                onOpenConnectionModal?.();
              }
            }}
            title={
              mode === 'usb_serial'
                ? 'Connected via USB Serial (COM8)'
                : 'Stream directly from ESP32 via USB (COM8) without Wi-Fi'
            }
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              mode === 'usb_serial'
                ? 'bg-[#EFF5F1] text-[#4E8168] border-[#DFECE3]'
                : 'bg-white text-aeris-textSecondary border-aeris-border hover:text-[#1A1D20]'
            }`}
          >
            <Usb className="w-3.5 h-3.5 stroke-[2]" />
            <span>
              {mode === 'usb_serial' ? 'USB COM8' : 'USB'}
            </span>
          </button>
        )}

        {/* Audio Mute Quick Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
          className="p-2 rounded-xl bg-white border border-aeris-border text-aeris-textSecondary hover:text-[#1A1D20] hover:shadow-2xs transition-all cursor-pointer"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#4E8168]" />
          )}
        </button>

        {/* Notification Bell with Badge */}
        <button
          onClick={onOpenNotifications}
          title="Notification Center"
          className="relative p-2 rounded-xl bg-white border border-aeris-border text-aeris-textSecondary hover:text-[#1A1D20] hover:shadow-2xs transition-all cursor-pointer"
        >
          <Bell className="w-4 h-4 stroke-[2]" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C94A4A] ring-2 ring-white" />
          )}
        </button>

        {/* ESP32 Hardware Status Hub Pill */}
        <button
          onClick={onOpenConnectionModal || onOpenSettings}
          title="Click to view hardware connection parameters & setup"
          className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-full bg-[#EDE9E1] hover:bg-[#E4DFD5] border border-[#E0D9CE] text-[#1A1D20] text-xs font-bold tracking-wider transition-all cursor-pointer shadow-2xs"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline
                ? 'bg-[#4E8168] shadow-[0_0_8px_rgba(78,129,104,0.7)] animate-pulse'
                : mode === 'cloud'
                ? 'bg-[#E5A038] animate-pulse'
                : 'bg-gray-400'
            }`}
          />
          <span className="text-[11px] font-extrabold uppercase tracking-wider">
            {mode === 'cloud'
              ? isCloudOnline
                ? 'ESP32 Wi-Fi Live'
                : 'Wi-Fi (Waiting...)'
              : mode === 'usb_serial'
              ? 'ESP32 USB Online'
              : mode === 'direct_ap'
              ? 'ESP32 SoftAP'
              : isOnline
              ? 'ESP32 Connected'
              : 'Device Offline'}
          </span>
        </button>

        {/* Timestamp */}
        <div className="hidden sm:flex flex-col text-right leading-tight">
          <span className="text-[11px] font-medium text-aeris-textSecondary">
            {dateStr || 'Mon, 12 Aug 2024'}
          </span>
          <span className="text-xs font-bold text-[#1A1D20] tabular-nums tracking-tight">
            {timeStr || '10:30:12 AM'}
          </span>
        </div>
      </div>
    </header>
  );
};
