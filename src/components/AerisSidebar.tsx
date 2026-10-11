import React from 'react';
import {
  Home,
  Activity,
  History,
  TrendingUp,
  Settings,
  Leaf,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ConnectionStatus } from '../types';

interface AerisSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  connectionStatus: ConnectionStatus;
  deviceId?: string;
  deviceIp?: string;
  onOpenDeviceInfo?: () => void;
  demoPreset?: 'screenshot_normal' | 'screenshot_alert' | 'dynamic';
  onSetPreset?: (preset: 'screenshot_normal' | 'screenshot_alert' | 'dynamic') => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const AerisSidebar: React.FC<AerisSidebarProps> = ({
  currentTab,
  onTabChange,
  connectionStatus,
  deviceId = 'AERIS-01',
  deviceIp = '192.168.1.85',
  onOpenDeviceInfo,
  demoPreset = 'screenshot_normal',
  onSetPreset,
  isMuted = false,
  onToggleMute,
}) => {
  const isOnline = connectionStatus === 'connected';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'live', label: 'Live Data', icon: Activity },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 xl:w-72 min-h-screen bg-aeris-bg p-6 flex flex-col justify-between shrink-0 select-none hidden lg:flex border-r border-[#EAE4D9]/80">
      {/* Top Brand & Navigation */}
      <div>
        {/* Brand */}
        <div className="flex items-center space-x-3 mb-9 px-1">
          <div className="w-10 h-10 rounded-2xl bg-[#EDE7DF] flex items-center justify-center text-[#9E4A3B]">
            <Leaf className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-[0.18em] text-[#1A1D20] leading-none">
              AERIS
            </div>
            <div className="text-[9px] font-bold tracking-[0.25em] text-aeris-textMuted uppercase mt-1">
              Gas Monitor
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-xs transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#EAE4D9] text-[#1A1D20] font-bold shadow-2xs'
                    : 'text-aeris-textSecondary hover:bg-white/60 hover:text-aeris-textPrimary font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#1A1D20]' : 'text-aeris-textSecondary'
                  }`}
                />
                <span className="text-sm tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Middle & Bottom Container */}
      <div className="space-y-4">
        {/* Quick Simulator / Hardware Switcher */}
        {onSetPreset && (
          <div className="bg-white/80 rounded-2xl border border-aeris-border p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-aeris-textSecondary">
                Mode Simulator
              </span>
              {onToggleMute && (
                <button
                  onClick={onToggleMute}
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  className="p-1 rounded-md text-aeris-textSecondary hover:text-black cursor-pointer transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[#4E8168]" />
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onSetPreset('screenshot_normal')}
                className={`px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                  demoPreset === 'screenshot_normal'
                    ? 'bg-[#EFF5F1] text-[#4E8168] border border-[#D5E4D9]'
                    : 'bg-[#FAF8F5] hover:bg-white text-aeris-textSecondary'
                }`}
              >
                Normal (842)
              </button>
              <button
                onClick={() => onSetPreset('screenshot_alert')}
                className={`px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                  demoPreset === 'screenshot_alert'
                    ? 'bg-[#FDF2F2] text-[#C94A4A] border border-[#F8D2D2]'
                    : 'bg-[#FAF8F5] hover:bg-white text-aeris-textSecondary'
                }`}
              >
                Alert (2260)
              </button>
            </div>

            <button
              onClick={() => onSetPreset('dynamic')}
              className={`w-full py-1.5 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                demoPreset === 'dynamic'
                  ? 'bg-[#1A1D20] text-white'
                  : 'bg-[#FAF8F5] hover:bg-white text-aeris-textSecondary'
              }`}
            >
              ESP32 Live Stream
            </button>
          </div>
        )}

        {/* Bottom Device Online Card */}
        <button
          onClick={onOpenDeviceInfo}
          title="Click to view hardware connection info"
          className="w-full bg-white rounded-3xl border border-aeris-border p-5 shadow-card text-left transition-all hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                isOnline
                  ? 'bg-[#4E8168] shadow-[0_0_8px_rgba(78,129,104,0.6)]'
                  : 'bg-gray-400'
              }`}
            />
            <span className="text-xs font-bold text-[#1A1D20]">
              {isOnline ? 'Device Online' : 'Device Offline'}
            </span>
          </div>

          <div className="mt-2.5 space-y-0.5">
            <div className="text-sm font-extrabold text-[#1A1D20]">{deviceId}</div>
            <div className="text-xs text-aeris-textMuted font-medium">ESP32 DevKit</div>
            <div className="text-xs text-aeris-textMuted font-medium">Local Wi-Fi</div>
            <div className="text-xs text-aeris-textMuted font-medium tabular-nums">
              {deviceIp}
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
};
