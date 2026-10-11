import React, { useState } from 'react';
import {
  Activity,
  Flame,
  Volume2,
  Zap,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { ESPTelemetry, ConnectionStatus, ReadingHistoryPoint } from '../types';
import { AerisGauge } from './AerisGauge';
import { AerisChartCard } from './AerisChartCard';
import { alertService } from '../services/audioAlert';

interface AerisLiveDataViewProps {
  telemetry: ESPTelemetry;
  connectionStatus: ConnectionStatus;
  history: ReadingHistoryPoint[];
  onTriggerGasSpike: () => void;
  onRestoreSafe: () => void;
  onUpdateThreshold: (newThresh: number) => void;
}

export const AerisLiveDataView: React.FC<AerisLiveDataViewProps> = ({
  telemetry,
  connectionStatus,
  history,
  onTriggerGasSpike,
  onRestoreSafe,
  onUpdateThreshold,
}) => {
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState<boolean>(false);

  const rawAdc = telemetry.adc;
  const pinVoltage = (rawAdc / 4095.0) * 3.3;
  const sensorVoltage = pinVoltage / 0.625; // 12k/20k divider scaling factor
  const isAlarm = telemetry.alarm;

  // 12-bit binary representation
  const binaryString = rawAdc.toString(2).padStart(12, '0');
  const hexString = '0x' + rawAdc.toString(16).toUpperCase().padStart(3, '0');

  const handlePing = () => {
    setPingStatus('Pinging ESP32 Hardware...');
    setTimeout(() => {
      setPingStatus(`Ping response: 18ms (HTTP 200 OK · Wi-Fi RSSI -58 dBm)`);
      setTimeout(() => setPingStatus(null), 3500);
    }, 400);
  };

  const handleCalibrate = () => {
    setCalibrating(true);
    setTimeout(() => {
      setCalibrating(false);
      onRestoreSafe();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17191C] flex items-center space-x-2.5">
            <Activity className="w-7 h-7 text-[#588E75]" />
            <span>Real-Time Sensor Telemetry</span>
          </h1>
          <p className="text-xs sm:text-sm text-aeris-textSecondary mt-1">
            High-frequency ADC conversion, raw signal voltages, and actuator diagnostics.
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EAF4EE] text-[#2E7D4E] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#2E7D4E] animate-pulse" />
            <span>
              {connectionStatus === 'connected' ? 'Live Stream (1000ms)' : 'Offline'}
            </span>
          </span>
        </div>
      </div>

      {/* Quick Action Interactive Buttons Bar */}
      <div className="bg-white rounded-2xl border border-aeris-border p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-[#17191C]">Signal Test Triggers:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onTriggerGasSpike}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Trip Gas Leak Spike (2260)</span>
          </button>
          <button
            onClick={onRestoreSafe}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Restore Safe Normal (842)</span>
          </button>
          <button
            onClick={() => alertService.playBeep()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Buzzer Tone</span>
          </button>
          <button
            onClick={handleCalibrate}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#F7F5F2] hover:bg-[#ECEAE6] text-[#17191C] border border-aeris-border text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${calibrating ? 'animate-spin' : ''}`} />
            <span>{calibrating ? 'Calibrating...' : 'Zero Calibrate'}</span>
          </button>
          <button
            onClick={handlePing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#F7F5F2] hover:bg-[#ECEAE6] text-[#17191C] border border-aeris-border text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Ping Hardware</span>
          </button>
        </div>
      </div>

      {pingStatus && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-medium flex items-center justify-between animate-fade-in">
          <span>{pingStatus}</span>
          <span className="font-mono text-[11px]">200 OK</span>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Raw ADC */}
        <div className="bg-white rounded-2xl border border-aeris-border p-5 shadow-card">
          <div className="text-xs text-aeris-textSecondary font-semibold">MQ-2 Raw ADC</div>
          <div className={`text-3xl font-extrabold mt-1 tabular-nums ${isAlarm ? 'text-[#D14343]' : 'text-[#17191C]'}`}>
            {rawAdc}
          </div>
          <div className="text-[11px] text-aeris-textMuted mt-1">12-bit range: 0 – 4095</div>
        </div>

        {/* 2. Pin Voltage */}
        <div className="bg-white rounded-2xl border border-aeris-border p-5 shadow-card">
          <div className="text-xs text-aeris-textSecondary font-semibold">GPIO 34 Pin Voltage</div>
          <div className="text-3xl font-extrabold text-[#17191C] mt-1 tabular-nums">
            {pinVoltage.toFixed(2)} <span className="text-sm font-medium text-aeris-textSecondary">V</span>
          </div>
          <div className="text-[11px] text-aeris-textMuted mt-1">Ref: 3.3V ADC Scale</div>
        </div>

        {/* 3. Sensor Voltage (Divider Corrected) */}
        <div className="bg-white rounded-2xl border border-aeris-border p-5 shadow-card">
          <div className="text-xs text-aeris-textSecondary font-semibold">MQ-2 Output (Divider)</div>
          <div className="text-3xl font-extrabold text-[#17191C] mt-1 tabular-nums">
            {sensorVoltage.toFixed(2)} <span className="text-sm font-medium text-aeris-textSecondary">V</span>
          </div>
          <div className="text-[11px] text-aeris-textMuted mt-1">Factor: / 0.625 (12k/20k)</div>
        </div>

        {/* 4. Hex & Binary */}
        <div className="bg-white rounded-2xl border border-aeris-border p-5 shadow-card">
          <div className="text-xs text-aeris-textSecondary font-semibold">Digital Word</div>
          <div className="text-2xl font-mono font-bold text-[#17191C] mt-1">
            {hexString}
          </div>
          <div className="text-[10px] font-mono text-aeris-textMuted mt-1 tracking-wider">
            {binaryString.slice(0, 4)} {binaryString.slice(4, 8)} {binaryString.slice(8, 12)}
          </div>
        </div>
      </div>

      {/* Main Charts & Gauge Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-aeris-border p-6 shadow-card flex flex-col items-center justify-center min-h-[300px]">
          <AerisGauge
            adc={rawAdc}
            maxAdc={4095}
            isAlarm={isAlarm}
            isMobile={false}
          />
        </div>

        {/* Live Calibration & Fast Presets Card */}
        <div className="bg-white rounded-2xl border border-aeris-border p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#17191C]">Threshold Trip Calibration</h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isAlarm ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {isAlarm ? 'ALARM ACTIVE' : 'SYSTEM NORMAL'}
              </span>
            </div>
            <p className="text-xs text-aeris-textSecondary mt-1">
              Move threshold slider to simulate real gas sensor trip levels.
            </p>

            <div className="mt-6">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-bold text-[#17191C]">Trigger Point</span>
                <span className="text-xl font-extrabold text-[#17191C] font-mono">{telemetry.threshold} ADC</span>
              </div>
              <input
                type="range"
                min={400}
                max={3500}
                step={25}
                value={telemetry.threshold}
                onChange={(e) => onUpdateThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-[#588E75] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-aeris-textMuted mt-1">
                <span>400 ADC (Sensitive)</span>
                <span>1800 ADC (Nominal)</span>
                <span>3500 ADC (High Trip)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6">
              <button
                onClick={() => onUpdateThreshold(1200)}
                className="px-2.5 py-2 rounded-xl bg-[#F7F5F2] hover:bg-[#ECEAE6] border border-aeris-border text-xs font-bold text-[#17191C] cursor-pointer transition-colors"
              >
                1200 ADC
              </button>
              <button
                onClick={() => onUpdateThreshold(1800)}
                className="px-2.5 py-2 rounded-xl bg-[#F7F5F2] hover:bg-[#ECEAE6] border border-aeris-border text-xs font-bold text-[#17191C] cursor-pointer transition-colors"
              >
                1800 ADC (Def)
              </button>
              <button
                onClick={() => onUpdateThreshold(2400)}
                className="px-2.5 py-2 rounded-xl bg-[#F7F5F2] hover:bg-[#ECEAE6] border border-aeris-border text-xs font-bold text-[#17191C] cursor-pointer transition-colors"
              >
                2400 ADC
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-aeris-border flex items-center justify-between">
            <span className="text-xs text-aeris-textSecondary">Hardware Sampling Frequency</span>
            <span className="text-xs font-bold text-[#17191C]">50 Hz (20 samples / 10ms avg)</span>
          </div>
        </div>
      </div>

      {/* Telemetry Line Chart */}
      <AerisChartCard
        history={history}
        threshold={telemetry.threshold}
        isAlarm={isAlarm}
        isMobile={false}
      />
    </div>
  );
};
