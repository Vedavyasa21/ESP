import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AerisSidebar } from './components/AerisSidebar';
import { AerisMobileTopBar, AerisMobileBottomBar } from './components/AerisMobileNav';
import { AerisHeaderBar } from './components/AerisHeaderBar';
import { AerisHeroBanner } from './components/AerisHeroBanner';
import { AerisSensorReadingCard } from './components/AerisSensorReadingCard';
import { AerisReadingChartCard } from './components/AerisReadingChartCard';
import { AerisWarningThresholdCard } from './components/AerisWarningThresholdCard';
import { AerisHardwareStatusCard } from './components/AerisHardwareStatusCard';
import { AerisDeviceStatusCard } from './components/AerisDeviceStatusCard';
import { AerisRecentEventsCard } from './components/AerisRecentEventsCard';
import { AerisAlertStatusCard } from './components/AerisAlertStatusCard';
import { AerisQuickInfoCard } from './components/AerisQuickInfoCard';
import { AerisNotificationModal } from './components/AerisNotificationModal';
import { AerisEmergencyAlarmModal } from './components/AerisEmergencyAlarmModal';
import { AerisLiveDataView } from './components/AerisLiveDataView';
import { AerisHistoryView } from './components/AerisHistoryView';
import { AerisAnalyticsView } from './components/AerisAnalyticsView';
import { AerisSettingsView } from './components/AerisSettingsView';
import { EndpointSettingsModal } from './components/EndpointSettingsModal';
import { AerisConnectionModal } from './components/AerisConnectionModal';

import {
  ESPTelemetry,
  ConnectionStatus,
  ConnectionMode,
  ReadingHistoryPoint,
  InferredHardwareState,
} from './types';
import { DEFAULT_ESP32_CONFIG } from './constants';
import {
  fetchEspTelemetry,
  deriveHardwareStates,
  simulator,
} from './services/espClient';
import { fetchCloudCurrent } from './services/cloudClient';
import { alertService } from './services/audioAlert';
import { webSerialClient } from './services/webSerialClient';

export const App: React.FC = () => {
  // Navigation & View State ('dashboard' | 'live' | 'history' | 'analytics' | 'settings')
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isAlarmPopupDismissed, setIsAlarmPopupDismissed] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Connectivity & Architecture State
  const [mode, setMode] = useState<ConnectionMode>('simulation');
  const [directEndpoint, setDirectEndpoint] = useState<string>(DEFAULT_ESP32_CONFIG.endpoint);
  const [cloudEndpoint, setCloudEndpoint] = useState<string>(
    typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
      ? window.location.origin
      : 'https://gasdetection.vercel.app'
  );
  const [deviceId, setDeviceId] = useState<string>('AERIS-01');
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(DEFAULT_ESP32_CONFIG.pollIntervalMs);

  // Exact Screenshot Replica Preset Mode
  const [demoPreset, setDemoPreset] = useState<'screenshot_normal' | 'screenshot_alert' | 'dynamic'>('screenshot_normal');

  // Dynamic Live Uptime (Initialized at 2h 14m 36s = 8076s from screenshot)
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(8076);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Telemetry State
  const [telemetry, setTelemetry] = useState<ESPTelemetry>({
    adc: 842,
    threshold: 1800,
    thresholdLow: 1650,
    alarm: false,
    ready: true,
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(new Date());
  const [lastSerialLine, setLastSerialLine] = useState<string>('');
  const [history, setHistory] = useState<ReadingHistoryPoint[]>([
    { id: '1', timestamp: Date.now() - 1800000, timeLabel: '10:00', adc: 980, threshold: 1800 },
    { id: '2', timestamp: Date.now() - 1500000, timeLabel: '10:05', adc: 1250, threshold: 1800 },
    { id: '3', timestamp: Date.now() - 1200000, timeLabel: '10:10', adc: 1120, threshold: 1800 },
    { id: '4', timestamp: Date.now() - 900000, timeLabel: '10:15', adc: 1420, threshold: 1800 },
    { id: '5', timestamp: Date.now() - 600000, timeLabel: '10:20', adc: 1180, threshold: 1800 },
    { id: '6', timestamp: Date.now() - 300000, timeLabel: '10:25', adc: 1100, threshold: 1800 },
    { id: '7', timestamp: Date.now(), timeLabel: '10:30', adc: 842, threshold: 1800 },
  ]);

  const isPollingRef = useRef<boolean>(false);
  const consecutiveErrorsRef = useRef<number>(0);

  // Derive hardware state
  const hardwareState: InferredHardwareState = deriveHardwareStates(
    telemetry,
    connectionStatus === 'connected'
  );

  const isAlarm = telemetry.alarm;

  // Dynamically calculate live min, avg, max based on current reading and session history
  const allSessionAdcs = history.map((h) => h.adc).concat(telemetry.adc);
  const minToday = Math.min(...allSessionAdcs);
  const maxToday = Math.max(...allSessionAdcs);
  const avgToday = Math.round(
    allSessionAdcs.reduce((acc, v) => acc + v, 0) / allSessionAdcs.length
  );

  // Append history
  const appendHistory = useCallback((point: { adc: number; threshold: number }) => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newPoint: ReadingHistoryPoint = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      timeLabel,
      adc: point.adc,
      threshold: point.threshold,
    };

    setHistory((prev) => {
      const next = [...prev, newPoint];
      if (next.length > 50) return next.slice(next.length - 50);
      return next;
    });
  }, []);

  // Poll executor
  const performPoll = useCallback(async () => {
    if (isPollingRef.current) return;
    if (mode === 'usb_serial') return;
    isPollingRef.current = true;

    try {
      if (mode === 'simulation') {
        if (demoPreset === 'screenshot_normal') {
          setTelemetry((prev) => ({
            ...prev,
            adc: 842,
            alarm: 842 >= prev.threshold,
            ready: true,
          }));
          setConnectionStatus('connected');
          setLastUpdatedAt(new Date());
        } else if (demoPreset === 'screenshot_alert') {
          setTelemetry((prev) => ({
            ...prev,
            adc: 2260,
            alarm: 2260 >= prev.threshold,
            ready: true,
          }));
          setConnectionStatus('connected');
          setLastUpdatedAt(new Date());
        } else {
          // Dynamic simulation
          const data = simulator.getTelemetry();
          setTelemetry(data);
          setConnectionStatus('connected');
          setLastUpdatedAt(new Date());
          appendHistory({ adc: data.adc, threshold: data.threshold });
        }
      } else if (mode === 'direct_ap') {
        // Physical ESP32 /api
        const data = await fetchEspTelemetry(directEndpoint, 2000);
        setTelemetry(data);
        setConnectionStatus('connected');
        consecutiveErrorsRef.current = 0;
        setLastUpdatedAt(new Date());
        appendHistory({ adc: data.adc, threshold: data.threshold });
      } else {
        // Cloud API
        const data = await fetchCloudCurrent(cloudEndpoint, deviceId, 2500);
        setTelemetry(data);
        setConnectionStatus(data.deviceOnline ? 'connected' : 'connecting');
        consecutiveErrorsRef.current = 0;
        setLastUpdatedAt(new Date());
        appendHistory({ adc: data.adc, threshold: data.threshold });
      }
    } catch {
      if (mode !== 'simulation') {
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= 3) {
          setConnectionStatus('offline');
        }
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [mode, demoPreset, directEndpoint, cloudEndpoint, deviceId, appendHistory]);

  // Polling loop
  useEffect(() => {
    performPoll();
    const interval = setInterval(performPoll, pollIntervalMs);
    return () => clearInterval(interval);
  }, [performPoll, pollIntervalMs]);

  // Handle Alarm transitions: Show pop-up modal & trigger browser notification
  const prevAlarmRef = useRef<boolean>(false);
  useEffect(() => {
    if (telemetry.alarm && !prevAlarmRef.current) {
      setIsAlarmPopupDismissed(false);
      alertService.triggerBrowserNotification(
        '⚠️ GAS LEAKAGE DETECTED!',
        `Gas reading (${telemetry.adc} ADC) has exceeded safety threshold of ${telemetry.threshold} ADC.`
      );
    }
    prevAlarmRef.current = telemetry.alarm;
  }, [telemetry.alarm, telemetry.adc, telemetry.threshold]);

  // Flashing Browser Tab Title during Alarm
  useEffect(() => {
    if (!telemetry.alarm) {
      document.title = 'AERIS · ESP32 Gas Monitor';
      return;
    }
    let flag = false;
    const titleInterval = setInterval(() => {
      document.title = flag
        ? `🚨 [ALARM: ${telemetry.adc} ADC] Gas Leak!`
        : `⚠️ HAZARD: Threshold Exceeded`;
      flag = !flag;
    }, 700);
    return () => {
      clearInterval(titleInterval);
      document.title = 'AERIS · ESP32 Gas Monitor';
    };
  }, [telemetry.alarm, telemetry.adc]);

  // Audio Alerts: Loud siren loop when alarm active and not muted
  useEffect(() => {
    if (telemetry.alarm && connectionStatus === 'connected' && !isMuted) {
      alertService.startAlarmLoop();
    } else {
      alertService.stopAlarm();
    }
    return () => {
      alertService.stopAlarm();
    };
  }, [telemetry.alarm, connectionStatus, isMuted]);

  // Interactive Threshold Change
  const handleUpdateThreshold = (newThresh: number) => {
    setTelemetry((prev) => {
      const isNowAlarm = prev.adc >= newThresh;
      return {
        ...prev,
        threshold: newThresh,
        thresholdLow: Math.max(100, newThresh - 150),
        alarm: isNowAlarm,
      };
    });
  };

  // Switch screenshot presets
  const handleSetPreset = (preset: 'screenshot_normal' | 'screenshot_alert' | 'dynamic') => {
    setDemoPreset(preset);
    if (preset === 'screenshot_normal') {
      setMode('simulation');
      setTelemetry({
        adc: 842,
        threshold: 1800,
        thresholdLow: 1650,
        alarm: false,
        ready: true,
      });
      setHistory([
        { id: '1', timestamp: Date.now() - 1800000, timeLabel: '10:00', adc: 980, threshold: 1800 },
        { id: '2', timestamp: Date.now() - 1500000, timeLabel: '10:05', adc: 1250, threshold: 1800 },
        { id: '3', timestamp: Date.now() - 1200000, timeLabel: '10:10', adc: 1120, threshold: 1800 },
        { id: '4', timestamp: Date.now() - 900000, timeLabel: '10:15', adc: 1420, threshold: 1800 },
        { id: '5', timestamp: Date.now() - 600000, timeLabel: '10:20', adc: 1180, threshold: 1800 },
        { id: '6', timestamp: Date.now() - 300000, timeLabel: '10:25', adc: 1100, threshold: 1800 },
        { id: '7', timestamp: Date.now(), timeLabel: '10:30', adc: 842, threshold: 1800 },
      ]);
    } else if (preset === 'screenshot_alert') {
      setMode('simulation');
      setTelemetry({
        adc: 2260,
        threshold: 1800,
        thresholdLow: 1650,
        alarm: true,
        ready: true,
      });
      setHistory([
        { id: '1', timestamp: Date.now() - 1800000, timeLabel: '10:00', adc: 1100, threshold: 1800 },
        { id: '2', timestamp: Date.now() - 1500000, timeLabel: '10:05', adc: 1280, threshold: 1800 },
        { id: '3', timestamp: Date.now() - 1200000, timeLabel: '10:10', adc: 1450, threshold: 1800 },
        { id: '4', timestamp: Date.now() - 900000, timeLabel: '10:15', adc: 1820, threshold: 1800 },
        { id: '5', timestamp: Date.now() - 600000, timeLabel: '10:20', adc: 2100, threshold: 1800 },
        { id: '6', timestamp: Date.now() - 300000, timeLabel: '10:25', adc: 2280, threshold: 1800 },
        { id: '7', timestamp: Date.now(), timeLabel: '10:30', adc: 2260, threshold: 1800 },
      ]);
    }
  };

  // Instant Trip Spike
  const handleTriggerGasSpike = () => {
    handleSetPreset('screenshot_alert');
  };

  // Instant Restore Safe
  const handleRestoreSafe = () => {
    handleSetPreset('screenshot_normal');
  };

  // Connect via Web Serial (COM8) directly over USB
  const handleConnectUsbSerial = async () => {
    try {
      await webSerialClient.connect(
        (data) => {
          setTelemetry(data);
          setConnectionStatus('connected');
          setLastUpdatedAt(new Date());
          appendHistory({ adc: data.adc, threshold: data.threshold });
        },
        (connected) => {
          setConnectionStatus(connected ? 'connected' : 'offline');
        },
        telemetry.threshold,
        (raw) => {
          setLastSerialLine(raw);
        }
      );
      setMode('usb_serial');
      setDemoPreset('dynamic');
    } catch (err) {
      console.warn('USB Serial connection cancelled or failed:', err);
    }
  };

  // Save from Settings view / modal
  const handleSaveConfig = (
    newMode: ConnectionMode,
    newDirect: string,
    newCloud: string,
    newDevice: string,
    newInterval: number
  ) => {
    setMode(newMode);
    setDirectEndpoint(newDirect);
    setCloudEndpoint(newCloud);
    setDeviceId(newDevice);
    setPollIntervalMs(newInterval);
    if (newMode !== 'simulation') {
      setDemoPreset('dynamic');
    }
  };

  return (
    <div className="min-h-screen bg-aeris-bg text-[#1A1D20] font-sans flex flex-col lg:flex-row antialiased selection:bg-[#EAE4D9]">
      {/* 1. Desktop Left Sidebar */}
      <AerisSidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        connectionStatus={connectionStatus}
        deviceId={deviceId}
        deviceIp="192.168.1.85"
        onOpenDeviceInfo={() => setIsConnectionModalOpen(true)}
        demoPreset={demoPreset}
        onSetPreset={handleSetPreset}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
      />

      {/* 2. Main Content Body - Desktop & Mobile Adaptive */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        {/* Mobile Top Navigation */}
        <AerisMobileTopBar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
        />

        {/* Dynamic View Rendering based on currentTab */}
        <main className="w-full max-w-[1520px] mx-auto px-5 sm:px-8 lg:px-10 xl:px-12 py-5 lg:py-8 flex-1">
          {/* TAB 1: DASHBOARD (Exact Replica of Reference Design) */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Bar */}
              <AerisHeaderBar
                connectionStatus={connectionStatus}
                mode={mode}
                isCloudOnline={Boolean(telemetry.deviceOnline)}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
                onOpenNotifications={() => setIsNotificationModalOpen(true)}
                onConnectUsb={handleConnectUsbSerial}
                onSelectMode={(newMode) => {
                  setMode(newMode);
                  if (newMode !== 'simulation') {
                    setDemoPreset('dynamic');
                  }
                }}
                unreadAlertsCount={isAlarm ? 2 : 1}
              />

              {/* Wi-Fi Cloud Live Stream Banner */}
              {mode === 'cloud' && (
                <div className="w-full bg-[#1A1D20] text-[#EDE9E1] px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-mono shadow-sm animate-fade-in border border-[#2D3136]">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        telemetry.deviceOnline
                          ? 'bg-[#4E8168] animate-pulse'
                          : 'bg-[#E5A038] animate-pulse'
                      }`}
                    />
                    <span className="text-[#8E9399] uppercase font-bold text-[10px] tracking-wider shrink-0">
                      Wi-Fi Cloud Sync:
                    </span>
                    <span className="truncate text-white font-semibold">
                      {telemetry.deviceOnline
                        ? `Streaming live from ESP32 (${deviceId}) · ADC: ${telemetry.adc} · Threshold: ${telemetry.threshold}`
                        : `Listening at ${cloudEndpoint.replace(/\/+$/, '')}/api/telemetry · Waiting for ESP32 packets...`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 pl-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider ${
                        telemetry.deviceOnline ? 'text-[#4E8168]' : 'text-[#E5A038]'
                      }`}
                    >
                      {telemetry.deviceOnline ? 'Cloud Stream Active' : 'Waiting for ESP32'}
                    </span>
                    <button
                      onClick={() => setIsConnectionModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-[#2D3136] hover:bg-[#3E434B] text-white text-[10px] font-sans font-bold transition-colors cursor-pointer"
                    >
                      Wi-Fi Guide
                    </button>
                  </div>
                </div>
              )}

              {/* USB Live Stream Banner (Displays raw serial data as it changes) */}
              {mode === 'usb_serial' && (
                <div className="w-full bg-[#1A1D20] text-[#EDE9E1] px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-mono shadow-sm animate-fade-in border border-[#2D3136]">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4E8168] animate-pulse shrink-0" />
                    <span className="text-[#8E9399] uppercase font-bold text-[10px] tracking-wider shrink-0">
                      COM8 Serial:
                    </span>
                    <span className="truncate text-white font-semibold">
                      {lastSerialLine || 'Streaming live data from ESP32 on COM8...'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#4E8168] font-extrabold uppercase tracking-wider shrink-0 pl-3">
                    Active 115200 Baud
                  </span>
                </div>
              )}

              {/* ROW 1: Hero Banner (8 cols) + Sensor Reading Arc Gauge (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-8 flex flex-col">
                  <AerisHeroBanner
                    isAlarm={isAlarm}
                    lastUpdatedText={lastUpdatedAt ? 'Just now' : 'Connecting...'}
                  />
                </div>
                <div className="lg:col-span-4 flex flex-col">
                  <AerisSensorReadingCard
                    adc={telemetry.adc}
                    maxAdc={4095}
                    isAlarm={isAlarm}
                    minToday={minToday}
                    avgToday={avgToday}
                    maxToday={maxToday}
                  />
                </div>
              </div>

              {/* ROW 2: Gas Reading Over Time (5 cols) + [Warning Threshold + Hardware Status] (3 cols) + Device Status (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 1. Gas Reading Over Time Area Chart */}
                <div className="lg:col-span-5 flex flex-col">
                  <AerisReadingChartCard
                    history={history}
                    threshold={telemetry.threshold}
                    isAlarm={isAlarm}
                  />
                </div>

                {/* 2. Middle Stacked Cards: Warning Threshold & Hardware Status */}
                <div className="lg:col-span-3 flex flex-col justify-between gap-6">
                  <AerisWarningThresholdCard
                    threshold={telemetry.threshold}
                    onThresholdChange={handleUpdateThreshold}
                    isAlarm={isAlarm}
                  />
                  <AerisHardwareStatusCard
                    hardwareState={hardwareState}
                    isOnline={connectionStatus === 'connected'}
                    onTestBuzzer={() => alertService.playBeep()}
                    onTestRedLed={() => {}}
                    onTestGreenLed={() => {}}
                  />
                </div>

                {/* 3. Device Status 9-Row Telemetry Card */}
                <div className="lg:col-span-4 flex flex-col">
                  <AerisDeviceStatusCard
                    connectionStatus={connectionStatus}
                    uptimeSeconds={uptimeSeconds}
                    rssi={-48}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                  />
                </div>
              </div>

              {/* ROW 3: Recent Events Table (5 cols) + Alert Status (3 cols) + Quick Info (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 1. Recent Events Table */}
                <div className="lg:col-span-5 flex flex-col">
                  <AerisRecentEventsCard
                    onViewAll={() => setCurrentTab('history')}
                    currentReading={{
                      adc: telemetry.adc,
                      threshold: telemetry.threshold,
                      alarm: isAlarm,
                    }}
                  />
                </div>

                {/* 2. Alert Status Box */}
                <div className="lg:col-span-3 flex flex-col">
                  <AerisAlertStatusCard
                    isAlarm={isAlarm}
                    threshold={telemetry.threshold}
                    currentAdc={telemetry.adc}
                    onSimulateAlarm={handleTriggerGasSpike}
                    onClearAlarm={handleRestoreSafe}
                  />
                </div>

                {/* 3. Quick Info Notice & Terracotta Link Banner */}
                <div className="lg:col-span-4 flex flex-col">
                  <AerisQuickInfoCard
                    onLearnMore={() => setIsSettingsModalOpen(true)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE DATA VIEW */}
          {currentTab === 'live' && (
            <AerisLiveDataView
              telemetry={telemetry}
              connectionStatus={connectionStatus}
              history={history}
              onTriggerGasSpike={handleTriggerGasSpike}
              onRestoreSafe={handleRestoreSafe}
              onUpdateThreshold={handleUpdateThreshold}
            />
          )}

          {/* TAB 3: HISTORY VIEW */}
          {currentTab === 'history' && (
            <AerisHistoryView
              history={history}
              threshold={telemetry.threshold}
              onClearHistory={() => setHistory([])}
              onAddSample={() =>
                appendHistory({
                  adc: telemetry.adc,
                  threshold: telemetry.threshold,
                })
              }
            />
          )}

          {/* TAB 4: ANALYTICS VIEW */}
          {currentTab === 'analytics' && (
            <AerisAnalyticsView
              currentAdc={telemetry.adc}
              threshold={telemetry.threshold}
            />
          )}

          {/* TAB 5: SETTINGS VIEW */}
          {currentTab === 'settings' && (
            <AerisSettingsView
              mode={mode}
              directEndpoint={directEndpoint}
              cloudEndpoint={cloudEndpoint}
              deviceId={deviceId}
              pollIntervalMs={pollIntervalMs}
              isMuted={isMuted}
              threshold={telemetry.threshold}
              onSaveConfig={handleSaveConfig}
              onToggleMute={() => setIsMuted(!isMuted)}
              onUpdateThreshold={handleUpdateThreshold}
            />
          )}
        </main>
      </div>

      {/* 3. Mobile Docked Bottom Bar (Home, History, Settings) */}
      <AerisMobileBottomBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenSettings={() => setCurrentTab('settings')}
      />

      {/* 4. ESP32 Hardware Connection Hub Modal (Wi-Fi Cloud & USB Serial) */}
      <AerisConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        mode={mode}
        connectionStatus={connectionStatus}
        telemetry={telemetry}
        cloudEndpoint={cloudEndpoint}
        deviceId={deviceId}
        onSelectMode={(newMode) => {
          setMode(newMode);
          if (newMode !== 'simulation') setDemoPreset('dynamic');
        }}
        onConnectUsb={handleConnectUsbSerial}
        onSaveCloudConfig={(newEndpoint, newDeviceId) => {
          setCloudEndpoint(newEndpoint);
          setDeviceId(newDeviceId);
        }}
      />

      {/* 5. Connectivity & Architecture Modal (Advanced Settings) */}
      <EndpointSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        mode={mode}
        directEndpoint={directEndpoint}
        cloudEndpoint={cloudEndpoint}
        deviceId={deviceId}
        pollIntervalMs={pollIntervalMs}
        onSaveConfig={handleSaveConfig}
      />

      {/* 5. Notification Center Modal */}
      <AerisNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        isAlarm={isAlarm}
      />

      {/* 6. Emergency Gas Leak Pop-up Modal */}
      <AerisEmergencyAlarmModal
        isOpen={isAlarm && !isAlarmPopupDismissed}
        adc={telemetry.adc}
        threshold={telemetry.threshold}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onDismiss={() => setIsAlarmPopupDismissed(true)}
      />
    </div>
  );
};

export default App;
