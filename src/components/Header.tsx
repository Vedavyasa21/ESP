import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Download,
} from 'lucide-react';
import { ConnectionStatus } from '../types';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  isDemoMode: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onManualRefresh: () => void;
  onExportCsv?: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  isDemoMode,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onManualRefresh,
  onExportCsv,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-aeris-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left Side: Brand & Product Info */}
        <div className="flex items-center space-x-3.5">
          {/* Custom Aeris Industrial Gas Aperture Symbol */}
          <div className="relative w-8 h-8 rounded border border-aeris-border bg-aeris-surface flex items-center justify-center shrink-0 shadow-2xs">
            <svg
              className="w-4 h-4 text-aeris-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3.5" />
              <path d="M12 2.5v3" />
              <path d="M12 18.5v3" />
              <path d="M2.5 12h3" />
              <path d="M18.5 12h3" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-aeris-accent opacity-80" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-wider text-aeris-primary">
                AERIS
              </span>
              <span className="text-[9px] uppercase font-mono font-medium px-1.5 py-0.2 rounded bg-aeris-surface text-aeris-secondary border border-aeris-border">
                REV 2.4
              </span>
              {isDemoMode && (
                <span className="text-[9px] uppercase font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Preview
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono tracking-wider text-aeris-secondary uppercase">
              ESP32 · MQ-2 Gas Monitor
            </p>
          </div>
        </div>

        {/* Right Side: Status Badge & Control Cluster */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Connection Status Pill */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-aeris-surface border border-aeris-border shadow-2xs">
            {connectionStatus === 'connected' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="text-[11px] font-mono font-medium text-aeris-primary tracking-tight hidden sm:inline">
                  ONLINE
                </span>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[11px] font-mono font-medium text-aeris-secondary tracking-tight hidden sm:inline">
                  LINKING
                </span>
                <Wifi className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                <span className="text-[11px] font-mono font-medium text-aeris-secondary tracking-tight hidden sm:inline">
                  OFFLINE
                </span>
                <WifiOff className="w-3.5 h-3.5 text-aeris-secondary ml-0.5" />
              </>
            )}
          </div>

          {/* Quick Audio Mute */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
            className="p-1.5 rounded hover:bg-aeris-surface text-aeris-secondary hover:text-aeris-primary transition-colors border border-transparent hover:border-aeris-border"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-aeris-secondary/50" />
            ) : (
              <Volume2 className="w-4 h-4 text-aeris-primary" />
            )}
          </button>

          {/* Export CSV Data Log (if provided) */}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              title="Export Telemetry CSV"
              className="p-1.5 rounded hover:bg-aeris-surface text-aeris-secondary hover:text-aeris-primary transition-colors border border-transparent hover:border-aeris-border hidden xs:inline-flex"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Manual Refresh */}
          <button
            onClick={onManualRefresh}
            title="Poll Now"
            className="p-1.5 rounded hover:bg-aeris-surface text-aeris-secondary hover:text-aeris-primary transition-colors border border-transparent hover:border-aeris-border"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? 'animate-spin text-aeris-accent' : ''
              }`}
            />
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={onOpenSettings}
            title="Settings & Connectivity"
            className="p-1.5 rounded hover:bg-aeris-surface text-aeris-secondary hover:text-aeris-primary transition-colors border border-transparent hover:border-aeris-border"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
