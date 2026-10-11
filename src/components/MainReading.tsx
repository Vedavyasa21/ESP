import React, { useRef, useEffect } from 'react';
import { AlertCircle, Clock, Zap, Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface MainReadingProps {
  adc: number | null;
  pinVoltage?: number;
  sensorVoltage?: number;
  threshold: number;
  thresholdLow?: number;
  alarm: boolean;
  ready: boolean;
  connectionStatus: ConnectionStatus;
  isStale: boolean;
  lastUpdatedAt: Date | null;
}

export const MainReading: React.FC<MainReadingProps> = ({
  adc,
  pinVoltage,
  sensorVoltage,
  threshold,
  thresholdLow = 1650,
  alarm,
  ready,
  connectionStatus,
  isStale,
  lastUpdatedAt,
}) => {
  const isOffline = connectionStatus === 'offline';
  const hasValue = adc !== null;
  const maxAdc = 4095;

  // Track delta change per update
  const prevAdcRef = useRef<number | null>(null);
  const deltaRef = useRef<number>(0);

  useEffect(() => {
    if (adc !== null && prevAdcRef.current !== null) {
      deltaRef.current = adc - prevAdcRef.current;
    }
    prevAdcRef.current = adc;
  }, [adc]);

  const currentPercentage = hasValue
    ? Math.min(100, Math.max(0, (adc / maxAdc) * 100))
    : 0;

  const thresholdHighPct = Math.min(100, Math.max(0, (threshold / maxAdc) * 100));
  const thresholdLowPct = Math.min(100, Math.max(0, (thresholdLow / maxAdc) * 100));

  const effectivePinVolt = pinVoltage !== undefined
    ? pinVoltage
    : hasValue
    ? Number(((adc / 4095.0) * 3.3).toFixed(2))
    : null;

  const effectiveSensorVolt = sensorVoltage !== undefined
    ? sensorVoltage
    : effectivePinVolt !== null
    ? Number((effectivePinVolt / 0.625).toFixed(2))
    : null;

  const formattedTime = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  const delta = deltaRef.current;

  return (
    <section className="bg-white border border-aeris-border rounded-xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
      {/* Subtle background ambient tint during active alarm */}
      {alarm && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
      )}

      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <span className="text-[11px] font-mono font-medium tracking-widest text-aeris-secondary uppercase">
            Live Sensor Reading
          </span>
          {!isOffline && !isStale && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aeris-accent opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-aeris-accent"></span>
            </span>
          )}
        </div>

        {/* Update timestamp */}
        <div className="flex items-center space-x-1.5 text-aeris-secondary text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-aeris-secondary/70" />
          <span className="tabular-nums">{formattedTime}</span>
        </div>
      </div>

      {/* Main Metric Hero Display */}
      <div className="my-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span
            className={`text-6xl sm:text-7xl md:text-8xl font-light tracking-tight tabular-nums transition-colors duration-300 ${
              isOffline
                ? 'text-aeris-secondary/40'
                : alarm
                ? 'text-red-600 font-normal drop-shadow-xs'
                : isStale
                ? 'text-aeris-secondary'
                : 'text-aeris-primary'
            }`}
          >
            {hasValue ? adc.toLocaleString() : '— — —'}
          </span>

          <div className="flex flex-col justify-end pb-2">
            <span className="text-xs font-mono font-semibold tracking-wider text-aeris-secondary uppercase">
              ADC Counts
            </span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-aeris-secondary/80">
                12-bit · 0–4095
              </span>

              {/* Rate of Change Trend Badge */}
              {hasValue && !isOffline && (
                <div
                  className={`inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${
                    delta > 5
                      ? 'bg-red-50 text-red-700 border border-red-200/60'
                      : delta < -5
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-aeris-surface text-aeris-secondary border border-aeris-border'
                  }`}
                >
                  {delta > 5 ? (
                    <>
                      <TrendingUp className="w-2.5 h-2.5" />
                      <span>+{delta}</span>
                    </>
                  ) : delta < -5 ? (
                    <>
                      <TrendingDown className="w-2.5 h-2.5" />
                      <span>{delta}</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-2.5 h-2.5" />
                      <span>STABLE</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stale Warning Banner */}
        {isStale && hasValue && (
          <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Telemetry interrupted. Displaying preserved reading.</span>
          </div>
        )}
      </div>

      {/* Analog Signal Display Sub-Grid (Voltages & Divider) */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
        {/* Pin Voltage */}
        <div className="p-3 bg-aeris-surface rounded-lg border border-aeris-border hover:border-aeris-border/80 transition-colors">
          <div className="flex items-center justify-between text-aeris-secondary text-[10px] mb-1">
            <span>GPIO 34 ADC PIN</span>
            <Zap className="w-3 h-3 text-aeris-accent" />
          </div>
          <div className="text-base font-semibold text-aeris-primary tabular-nums">
            {effectivePinVolt !== null ? `${effectivePinVolt.toFixed(2)} V` : '--'}
          </div>
          <span className="text-[10px] text-aeris-secondary/70">0–3.3V Microcontroller</span>
        </div>

        {/* Sensor Output Voltage */}
        <div className="p-3 bg-aeris-surface rounded-lg border border-aeris-border hover:border-aeris-border/80 transition-colors">
          <div className="flex items-center justify-between text-aeris-secondary text-[10px] mb-1">
            <span>MQ-2 SENSOR AO</span>
            <Gauge className="w-3 h-3 text-aeris-accent" />
          </div>
          <div className="text-base font-semibold text-aeris-primary tabular-nums">
            {effectiveSensorVolt !== null ? `${effectiveSensorVolt.toFixed(2)} V` : '--'}
          </div>
          <span className="text-[10px] text-aeris-secondary/70">12k/20k Divider (0.625x)</span>
        </div>

        {/* Hysteresis Threshold Band */}
        <div className="col-span-2 sm:col-span-1 p-3 bg-aeris-surface rounded-lg border border-aeris-border hover:border-aeris-border/80 transition-colors">
          <div className="text-aeris-secondary text-[10px] mb-1">
            HYSTERESIS LIMITS
          </div>
          <div className="text-xs font-semibold text-aeris-primary tabular-nums mt-0.5">
            Trip: {threshold} / Reset: {thresholdLow}
          </div>
          <span className="text-[10px] text-aeris-secondary/70">150 ADC Noise Buffer</span>
        </div>
      </div>

      {/* Precision Scale & Gauge */}
      <div className="mt-6 pt-5 border-t border-aeris-border">
        {/* Metric Metadata Row */}
        <div className="flex items-center justify-between text-xs font-mono text-aeris-secondary mb-2">
          <span>0 ADC (0.00V)</span>
          <span className="text-aeris-primary font-medium text-[11px]">
            TRIP LIMIT: {threshold} ADC ({((threshold / 4095) * 3.3).toFixed(2)}V)
          </span>
          <span>4095 ADC (3.30V)</span>
        </div>

        {/* Range Bar with Hysteresis Span */}
        <div className="relative h-2.5 w-full bg-aeris-surface rounded-full border border-aeris-border/80 overflow-visible">
          {/* Shaded Hysteresis Band */}
          <div
            className="absolute top-0 bottom-0 bg-amber-100/70 z-0"
            style={{
              left: `${thresholdLowPct}%`,
              width: `${Math.max(0, thresholdHighPct - thresholdLowPct)}%`,
            }}
            title={`Hysteresis Range: ${thresholdLow} to ${threshold} ADC`}
          />

          {/* Active Level Fill Bar */}
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out z-10 relative ${
              isOffline
                ? 'bg-aeris-secondary/30'
                : alarm
                ? 'bg-red-600 shadow-xs'
                : !ready
                ? 'bg-amber-400'
                : 'bg-aeris-accent'
            }`}
            style={{ width: `${currentPercentage}%` }}
          />

          {/* Reset Marker Hairline (1650) */}
          <div
            className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-amber-600 z-20"
            style={{ left: `${thresholdLowPct}%` }}
            title={`Clear Limit: ${thresholdLow}`}
          />

          {/* Trip Marker Hairline (1800) */}
          <div
            className="absolute top-[-4px] bottom-[-4px] w-1 bg-red-600 z-20 rounded-full"
            style={{ left: `${thresholdHighPct}%` }}
            title={`Trip Limit: ${threshold}`}
          />
        </div>

        {/* Guidance Note */}
        <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-aeris-secondary">
          <span>Scale: 0–4095 (12-bit ADC)</span>
          <span>Calibrated voltage divider signal</span>
        </div>
      </div>
    </section>
  );
};
