import React, { useState } from 'react';
import { X, Flame, RefreshCcw, Check, HelpCircle, Cloud, Radio, Sparkles } from 'lucide-react';
import { simulator } from '../services/espClient';
import { ConnectionMode } from '../types';

interface EndpointSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ConnectionMode;
  directEndpoint: string;
  cloudEndpoint: string;
  deviceId: string;
  pollIntervalMs: number;
  onSaveConfig: (
    mode: ConnectionMode,
    directEndpoint: string,
    cloudEndpoint: string,
    deviceId: string,
    interval: number
  ) => void;
}

export const EndpointSettingsModal: React.FC<EndpointSettingsModalProps> = ({
  isOpen,
  onClose,
  mode,
  directEndpoint,
  cloudEndpoint,
  deviceId,
  pollIntervalMs,
  onSaveConfig,
}) => {
  const [selectedMode, setSelectedMode] = useState<ConnectionMode>(mode);
  const [tempDirectEndpoint, setTempDirectEndpoint] = useState(directEndpoint);
  const [tempCloudEndpoint, setTempCloudEndpoint] = useState(cloudEndpoint);
  const [tempDeviceId, setTempDeviceId] = useState(deviceId);
  const [tempInterval, setTempInterval] = useState(pollIntervalMs);

  const [isWarmingSim, setIsWarmingSim] = useState(false);
  const [spikeTriggered, setSpikeTriggered] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(
      selectedMode,
      tempDirectEndpoint.trim(),
      tempCloudEndpoint.trim(),
      tempDeviceId.trim(),
      tempInterval
    );
    onClose();
  };

  const handleTriggerSpike = () => {
    simulator.triggerGasSpike(9000);
    setSpikeTriggered(true);
    setTimeout(() => setSpikeTriggered(false), 9000);
  };

  const handleToggleWarmUp = () => {
    const nextState = !isWarmingSim;
    setIsWarmingSim(nextState);
    simulator.setWarmUp(nextState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-lg border border-aeris-border shadow-xl max-w-md w-full overflow-hidden text-aeris-primary max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-aeris-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-semibold tracking-wide">
              Connection & Architecture Settings
            </h3>
            <p className="text-[11px] font-mono text-aeris-secondary">
              AERIS Network & Telemetry Configuration
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-aeris-surface text-aeris-secondary hover:text-aeris-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-5 space-y-5 text-xs font-mono overflow-y-auto">
          {/* Architecture Mode Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-aeris-primary mb-2">
              Architecture Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMode('simulation')}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-colors ${
                  selectedMode === 'simulation'
                    ? 'border-aeris-accent bg-aeris-accentLight/40 text-aeris-primary font-medium'
                    : 'border-aeris-border bg-white text-aeris-secondary hover:bg-aeris-surface'
                }`}
              >
                <Sparkles className="w-4 h-4 mb-1 text-aeris-accent" />
                <span className="text-[11px]">Preview</span>
                <span className="text-[9px] text-aeris-secondary">Simulated</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('direct_ap')}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-colors ${
                  selectedMode === 'direct_ap'
                    ? 'border-aeris-accent bg-aeris-accentLight/40 text-aeris-primary font-medium'
                    : 'border-aeris-border bg-white text-aeris-secondary hover:bg-aeris-surface'
                }`}
              >
                <Radio className="w-4 h-4 mb-1 text-aeris-accent" />
                <span className="text-[11px]">Direct AP</span>
                <span className="text-[9px] text-aeris-secondary">192.168.4.1</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('cloud')}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-colors ${
                  selectedMode === 'cloud'
                    ? 'border-aeris-accent bg-aeris-accentLight/40 text-aeris-primary font-medium'
                    : 'border-aeris-border bg-white text-aeris-secondary hover:bg-aeris-surface'
                }`}
              >
                <Cloud className="w-4 h-4 mb-1 text-aeris-accent" />
                <span className="text-[11px]">Cloud API</span>
                <span className="text-[9px] text-aeris-secondary">Vercel/FCM</span>
              </button>
            </div>
          </div>

          {/* Interactive Simulation Controls (When in Simulation mode) */}
          {selectedMode === 'simulation' && (
            <div className="p-3 rounded bg-aeris-surface border border-aeris-border">
              <span className="text-[11px] font-semibold text-aeris-primary block mb-2">
                Simulated Test Triggers
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTriggerSpike}
                  className={`flex-1 py-1.5 px-2 rounded border text-[11px] flex items-center justify-center space-x-1.5 transition-colors ${
                    spikeTriggered
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-white border-aeris-border text-aeris-primary hover:bg-aeris-surface'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>{spikeTriggered ? 'Alarm Active (9s)' : 'Trigger Gas Spike'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleWarmUp}
                  className={`py-1.5 px-2.5 rounded border text-[11px] flex items-center justify-center space-x-1 transition-colors ${
                    isWarmingSim
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-white border-aeris-border text-aeris-primary hover:bg-aeris-surface'
                  }`}
                >
                  <RefreshCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isWarmingSim ? 'Warming' : 'Ready'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Direct AP Mode Inputs */}
          {selectedMode === 'direct_ap' && (
            <div>
              <label className="block text-[11px] font-semibold text-aeris-primary mb-1">
                Direct ESP32 JSON Endpoint
              </label>
              <input
                type="text"
                value={tempDirectEndpoint}
                onChange={(e) => setTempDirectEndpoint(e.target.value)}
                placeholder="http://192.168.4.1/api"
                className="w-full px-3 py-2 text-xs bg-aeris-surface border border-aeris-border rounded focus:outline-none focus:border-aeris-accent focus:bg-white transition-colors"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTempDirectEndpoint('http://192.168.4.1/api')}
                  className="px-2 py-0.5 rounded bg-aeris-surface hover:bg-aeris-border border border-aeris-border text-[10px] text-aeris-secondary"
                >
                  SoftAP (192.168.4.1)
                </button>
                <button
                  type="button"
                  onClick={() => setTempDirectEndpoint('http://aeris.local/api')}
                  className="px-2 py-0.5 rounded bg-aeris-surface hover:bg-aeris-border border border-aeris-border text-[10px] text-aeris-secondary"
                >
                  mDNS (aeris.local)
                </button>
                <button
                  type="button"
                  onClick={() => setTempDirectEndpoint('/esp-proxy/api')}
                  className="px-2 py-0.5 rounded bg-aeris-surface hover:bg-aeris-border border border-aeris-border text-[10px] text-aeris-secondary"
                >
                  Vite Proxy (/esp-proxy)
                </button>
              </div>
            </div>
          )}

          {/* Cloud API Mode Inputs */}
          {selectedMode === 'cloud' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-aeris-primary mb-1">
                  Cloud Backend Base URL
                </label>
                <input
                  type="text"
                  value={tempCloudEndpoint}
                  onChange={(e) => setTempCloudEndpoint(e.target.value)}
                  placeholder="http://localhost:4000 or https://your-backend.domain"
                  className="w-full px-3 py-2 text-xs bg-aeris-surface border border-aeris-border rounded focus:outline-none focus:border-aeris-accent focus:bg-white transition-colors"
                />
                <p className="text-[10px] text-aeris-secondary mt-1">
                  Used by HTTPS hosted clients (e.g. Vercel) to query cloud database without mixed content issues.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-aeris-primary mb-1">
                  Target Device ID
                </label>
                <input
                  type="text"
                  value={tempDeviceId}
                  onChange={(e) => setTempDeviceId(e.target.value)}
                  placeholder="aeris-esp32-01"
                  className="w-full px-3 py-2 text-xs bg-aeris-surface border border-aeris-border rounded focus:outline-none focus:border-aeris-accent focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          {/* Polling Interval */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-aeris-primary">
                Polling Interval
              </label>
              <span className="text-aeris-secondary">{tempInterval} ms</span>
            </div>
            <input
              type="range"
              min="1000"
              max="5000"
              step="500"
              value={tempInterval}
              onChange={(e) => setTempInterval(Number(e.target.value))}
              className="w-full accent-aeris-accent"
            />
          </div>

          {/* Background Web Push Notification Test */}
          <div className="p-3 bg-aeris-surface rounded border border-aeris-border flex items-center justify-between">
            <div>
              <span className="font-semibold text-aeris-primary block">Web Push Notifications</span>
              <span className="text-[10px] text-aeris-secondary">Desktop & Mobile background alerts</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                if ('Notification' in window) {
                  const res = await Notification.requestPermission();
                  if (res === 'granted' && 'serviceWorker' in navigator) {
                    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                  }
                  alert(res === 'granted' ? 'Notification permissions granted & service worker active.' : 'Notification permissions denied.');
                } else {
                  alert('Web Notifications not supported on this browser.');
                }
              }}
              className="px-2.5 py-1 rounded bg-white border border-aeris-border hover:bg-aeris-surface text-[10px] text-aeris-primary"
            >
              Enable Notifications
            </button>
          </div>

          {/* Wi-Fi & Mobile Tip */}
          <div className="p-3 bg-aeris-surface rounded border border-aeris-border text-[10px] text-aeris-secondary leading-normal flex items-start space-x-2">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-aeris-secondary" />
            <span>
              <strong>HTTPS Note:</strong> When hosting on Vercel, use <strong>Cloud API mode</strong>. Browsers block direct plain HTTP requests to private local IPs like <code>192.168.4.1</code> from secure HTTPS websites.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 bg-aeris-surface border-t border-aeris-border flex items-center justify-end space-x-2 font-mono text-xs shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-aeris-border hover:bg-white text-aeris-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-aeris-primary text-white hover:bg-black transition-colors flex items-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
