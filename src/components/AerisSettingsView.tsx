import React, { useState } from 'react';
import {
  Settings,
  Wifi,
  Sliders,
  Volume2,
  VolumeX,
  Bell,
  Cpu,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ConnectionMode } from '../types';

interface AerisSettingsViewProps {
  mode: ConnectionMode;
  directEndpoint: string;
  cloudEndpoint: string;
  deviceId: string;
  pollIntervalMs: number;
  isMuted: boolean;
  threshold: number;
  onSaveConfig: (
    mode: ConnectionMode,
    directEndpoint: string,
    cloudEndpoint: string,
    deviceId: string,
    pollIntervalMs: number
  ) => void;
  onToggleMute: () => void;
  onUpdateThreshold: (newThresh: number) => void;
}

export const AerisSettingsView: React.FC<AerisSettingsViewProps> = ({
  mode,
  directEndpoint,
  cloudEndpoint,
  deviceId,
  pollIntervalMs,
  isMuted,
  threshold,
  onSaveConfig,
  onToggleMute,
  onUpdateThreshold,
}) => {
  const [localMode, setLocalMode] = useState<ConnectionMode>(mode);
  const [localDirect, setLocalDirect] = useState<string>(directEndpoint);
  const [localCloud, setLocalCloud] = useState<string>(cloudEndpoint);
  const [localDevice, setLocalDevice] = useState<string>(deviceId);
  const [localInterval, setLocalInterval] = useState<number>(pollIntervalMs);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const handleSave = () => {
    onSaveConfig(localMode, localDirect, localCloud, localDevice, localInterval);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleResetDefaults = () => {
    setLocalMode('simulation');
    setLocalDirect('http://192.168.4.1/api');
    setLocalCloud('http://localhost:4000');
    setLocalDevice('aeris-esp32-01');
    setLocalInterval(2000);
    onUpdateThreshold(1800);
    onSaveConfig('simulation', 'http://192.168.4.1/api', 'http://localhost:4000', 'aeris-esp32-01', 2000);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleRequestPush = async () => {
    if (!('Notification' in window)) {
      setNotificationStatus('Notifications not supported in this browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationStatus('Push notifications enabled!');
      new Notification('AERIS Gas Monitor', {
        body: 'Alert notifications active. You will be alerted upon gas detection.',
      });
    } else {
      setNotificationStatus('Notification permission denied.');
    }
    setTimeout(() => setNotificationStatus(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17191C] flex items-center space-x-2.5">
            <Settings className="w-7 h-7 text-[#588E75]" />
            <span>System Settings & Calibration</span>
          </h1>
          <p className="text-xs sm:text-sm text-aeris-textSecondary mt-1">
            Hardware interface modes, polling frequencies, trip thresholds, and audio preferences.
          </p>
        </div>

        {savedNotice && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* 1. Connection Mode Selector */}
      <div className="bg-white rounded-2xl border border-aeris-border p-6 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-[#17191C] flex items-center space-x-2">
          <Wifi className="w-4 h-4 text-[#588E75]" />
          <span>Connectivity Architecture</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setLocalMode('simulation')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              localMode === 'simulation'
                ? 'border-[#588E75] bg-[#EAF4EE]/40 ring-1 ring-[#588E75]'
                : 'border-aeris-border bg-[#F7F5F2] hover:bg-white'
            }`}
          >
            <div className="font-bold text-xs text-[#17191C]">Simulation Mode</div>
            <div className="text-[11px] text-aeris-textSecondary mt-1">
              Synthetic sensor simulation with instant state toggle.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLocalMode('direct_ap')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              localMode === 'direct_ap'
                ? 'border-[#588E75] bg-[#EAF4EE]/40 ring-1 ring-[#588E75]'
                : 'border-aeris-border bg-[#F7F5F2] hover:bg-white'
            }`}
          >
            <div className="font-bold text-xs text-[#17191C]">Direct SoftAP</div>
            <div className="text-[11px] text-aeris-textSecondary mt-1">
              Connect to ESP32 Wi-Fi AP at 192.168.4.1/api.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLocalMode('cloud')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              localMode === 'cloud'
                ? 'border-[#588E75] bg-[#EAF4EE]/40 ring-1 ring-[#588E75]'
                : 'border-aeris-border bg-[#F7F5F2] hover:bg-white'
            }`}
          >
            <div className="font-bold text-xs text-[#17191C]">Cloud / Vercel API</div>
            <div className="text-[11px] text-aeris-textSecondary mt-1">
              Remote monitoring over HTTPS via cloud ingestion.
            </div>
          </button>
        </div>

        {/* Dynamic Endpoint Configuration */}
        {localMode === 'direct_ap' && (
          <div className="pt-2">
            <label className="block text-xs font-semibold text-aeris-textSecondary mb-1">
              ESP32 HTTP Endpoint URL
            </label>
            <input
              type="text"
              value={localDirect}
              onChange={(e) => setLocalDirect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-aeris-border bg-[#FAF9F6] text-xs font-mono font-bold text-[#17191C] focus:outline-none focus:border-[#588E75]"
              placeholder="http://192.168.4.1/api or http://aeris.local/api"
            />
          </div>
        )}

        {localMode === 'cloud' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-aeris-textSecondary mb-1">
                Cloud Backend Base URL
              </label>
              <input
                type="text"
                value={localCloud}
                onChange={(e) => setLocalCloud(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-aeris-border bg-[#FAF9F6] text-xs font-mono font-bold text-[#17191C] focus:outline-none focus:border-[#588E75]"
                placeholder="https://your-aeris.vercel.app/api"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aeris-textSecondary mb-1">
                Device Identifier
              </label>
              <input
                type="text"
                value={localDevice}
                onChange={(e) => setLocalDevice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-aeris-border bg-[#FAF9F6] text-xs font-mono font-bold text-[#17191C] focus:outline-none focus:border-[#588E75]"
                placeholder="aeris-esp32-01"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Threshold Calibration & Polling Interval */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-aeris-border p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-[#17191C] flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#588E75]" />
            <span>Alarm Trip Threshold</span>
          </h3>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-aeris-textSecondary">High Gas Threshold</span>
              <span className="text-xl font-extrabold text-[#17191C] font-mono">{threshold} ADC</span>
            </div>
            <input
              type="range"
              min={300}
              max={3800}
              step={20}
              value={threshold}
              onChange={(e) => onUpdateThreshold(parseInt(e.target.value, 10))}
              className="w-full accent-[#588E75] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-aeris-textMuted mt-1">
              <span>Low (300)</span>
              <span>Nominal (1800)</span>
              <span>High (3800)</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-aeris-textMuted">
            Hardware hysteresis clears alarm when gas drops below <strong className="text-[#17191C]">1650 ADC</strong>.
          </div>
        </div>

        {/* Polling Interval */}
        <div className="bg-white rounded-2xl border border-aeris-border p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-[#17191C] flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#588E75]" />
            <span>Polling Interval</span>
          </h3>

          <div className="space-y-2">
            {[
              { val: 1000, label: '1,000 ms (Fast / Responsive)' },
              { val: 2000, label: '2,000 ms (Nominal Standard)' },
              { val: 5000, label: '5,000 ms (Low Bandwidth)' },
            ].map((item) => (
              <label
                key={item.val}
                className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-[#F7F5F2] cursor-pointer text-xs"
              >
                <input
                  type="radio"
                  name="pollInterval"
                  checked={localInterval === item.val}
                  onChange={() => setLocalInterval(item.val)}
                  className="accent-[#588E75]"
                />
                <span className="font-medium text-[#17191C]">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Audio & Notifications */}
      <div className="bg-white rounded-2xl border border-aeris-border p-6 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-[#17191C] flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-[#588E75]" />
          <span>Alerts & Notifications</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 bg-[#FAF9F6] rounded-xl border border-aeris-border">
            <div>
              <div className="text-xs font-bold text-[#17191C]">Dashboard Sound Alert</div>
              <div className="text-[11px] text-aeris-textSecondary">Web Audio synthesized alarm</div>
            </div>
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                !isMuted
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}
            >
              {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#FAF9F6] rounded-xl border border-aeris-border">
            <div>
              <div className="text-xs font-bold text-[#17191C]">Browser Push Alerts</div>
              <div className="text-[11px] text-aeris-textSecondary">OS notifications during alarm</div>
            </div>
            <button
              onClick={handleRequestPush}
              className="px-3 py-1.5 rounded-xl bg-[#17191C] text-white hover:bg-black text-xs font-bold transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 inline mr-1" />
              <span>Enable</span>
            </button>
          </div>
        </div>

        {notificationStatus && (
          <div className="p-2.5 bg-blue-50 text-blue-800 text-xs rounded-xl font-medium">
            {notificationStatus}
          </div>
        )}
      </div>

      {/* 4. Hardware Pinout Reference */}
      <div className="bg-white rounded-2xl border border-aeris-border p-6 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-[#17191C] flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-[#588E75]" />
          <span>ESP32 Hardware Pin Assignment</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-aeris-border">
            <span className="text-aeris-textSecondary block text-[10px] font-semibold">MQ-2 Analog In</span>
            <strong className="text-sm text-[#17191C]">GPIO 34</strong>
            <span className="text-[10px] text-aeris-textMuted block mt-0.5">12k/20k Divider</span>
          </div>

          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-aeris-border">
            <span className="text-aeris-textSecondary block text-[10px] font-semibold">Green LED</span>
            <strong className="text-sm text-[#588E75]">GPIO 18</strong>
            <span className="text-[10px] text-aeris-textMuted block mt-0.5">220Ω Resistor</span>
          </div>

          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-aeris-border">
            <span className="text-aeris-textSecondary block text-[10px] font-semibold">Red LED</span>
            <strong className="text-sm text-[#D14343]">GPIO 19</strong>
            <span className="text-[10px] text-aeris-textMuted block mt-0.5">220Ω Resistor</span>
          </div>

          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-aeris-border">
            <span className="text-aeris-textSecondary block text-[10px] font-semibold">Active Buzzer</span>
            <strong className="text-sm text-[#D14343]">GPIO 23</strong>
            <span className="text-[10px] text-aeris-textMuted block mt-0.5">2N2222 Transistor</span>
          </div>
        </div>
      </div>

      {/* Bottom Save & Reset Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleResetDefaults}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-aeris-border text-xs font-semibold text-aeris-textSecondary hover:text-black cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>

        <button
          onClick={handleSave}
          className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-[#17191C] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
};

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
