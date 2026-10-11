import React from 'react';
import { Lightbulb, Bell, Info } from 'lucide-react';
import { InferredHardwareState } from '../types';

interface HardwareStatusCardProps {
  hardwareState: InferredHardwareState;
  isOnline: boolean;
}

export const HardwareStatusCard: React.FC<HardwareStatusCardProps> = ({
  hardwareState,
  isOnline,
}) => {
  const { greenLed, redLed, buzzer } = hardwareState;

  return (
    <section className="bg-white border border-aeris-border rounded-xl p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[11px] font-mono font-medium tracking-widest text-aeris-secondary uppercase">
            Hardware Actuators & Indicators
          </h3>
          <p className="text-[10px] text-aeris-secondary font-mono mt-0.5">
            Physical ESP32 GPIO line status
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aeris-surface border border-aeris-border text-aeris-secondary">
          3 Actuators
        </span>
      </div>

      {/* Actuator Rows */}
      <div className="divide-y divide-aeris-border/60">
        {/* Row 1: Green LED */}
        <div className="py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div
              className={`p-2 rounded-lg border transition-all ${
                greenLed.active && isOnline
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                  : 'bg-aeris-surface border-aeris-border text-aeris-secondary/60'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-semibold text-aeris-primary font-mono">Green LED</p>
                <span className="text-[10px] font-mono text-aeris-secondary bg-aeris-surface px-1.5 py-0.2 rounded border border-aeris-border/60">
                  GPIO 18
                </span>
              </div>
              <p className="text-[10px] font-mono text-aeris-secondary mt-0.5">
                Safe Status · 220Ω Resistor
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded border transition-colors ${
                greenLed.active && isOnline
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-aeris-surface border-aeris-border text-aeris-secondary/70'
              }`}
            >
              {isOnline ? (greenLed.active ? 'ON' : 'OFF') : 'OFF'}
            </span>
          </div>
        </div>

        {/* Row 2: Red LED */}
        <div className="py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div
              className={`p-2 rounded-lg border transition-all ${
                redLed.active && isOnline
                  ? 'bg-red-50 border-red-300 text-red-700 shadow-xs animate-pulse'
                  : 'bg-aeris-surface border-aeris-border text-aeris-secondary/60'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-semibold text-aeris-primary font-mono">Red LED</p>
                <span className="text-[10px] font-mono text-aeris-secondary bg-aeris-surface px-1.5 py-0.2 rounded border border-aeris-border/60">
                  GPIO 19
                </span>
              </div>
              <p className="text-[10px] font-mono text-aeris-secondary mt-0.5">
                Hazard Trip · 220Ω Resistor
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded border transition-colors ${
                redLed.active && isOnline
                  ? 'bg-red-50 border-red-300 text-red-800'
                  : 'bg-aeris-surface border-aeris-border text-aeris-secondary/70'
              }`}
            >
              {isOnline ? (redLed.active ? 'ON' : 'OFF') : 'OFF'}
            </span>
          </div>
        </div>

        {/* Row 3: Buzzer */}
        <div className="py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div
              className={`p-2 rounded-lg border transition-all ${
                buzzer.active && isOnline
                  ? 'bg-red-50 border-red-300 text-red-700 shadow-xs animate-pulse'
                  : 'bg-aeris-surface border-aeris-border text-aeris-secondary/60'
              }`}
            >
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-semibold text-aeris-primary font-mono">Active Buzzer</p>
                <span className="text-[10px] font-mono text-aeris-secondary bg-aeris-surface px-1.5 py-0.2 rounded border border-aeris-border/60">
                  GPIO 23
                </span>
              </div>
              <p className="text-[10px] font-mono text-aeris-secondary mt-0.5">
                Audible Alarm · 2N2222 NPN Transistor & 1kΩ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded border transition-colors ${
                buzzer.active && isOnline
                  ? 'bg-red-50 border-red-300 text-red-800'
                  : 'bg-aeris-surface border-aeris-border text-aeris-secondary/70'
              }`}
            >
              {isOnline ? (buzzer.active ? 'ACTIVE' : 'INACTIVE') : 'INACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Circuit Hardware Note */}
      <div className="mt-4 pt-3.5 border-t border-aeris-border/60 flex items-start space-x-2 text-[10px] text-aeris-secondary font-mono leading-relaxed">
        <Info className="w-3.5 h-3.5 text-aeris-secondary shrink-0 mt-0.5" />
        <span>
          Circuit logic: LEDs and buzzer are driven by local firmware tasks. If Wi-Fi communication drops, the physical outputs continue operating independently.
        </span>
      </div>
    </section>
  );
};
