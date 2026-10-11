import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { ReadingHistoryPoint } from '../types';
import { Activity, Download } from 'lucide-react';

interface SensorHistoryChartProps {
  history: ReadingHistoryPoint[];
  threshold: number;
  thresholdLow?: number;
  maxSamples?: number;
}

export const SensorHistoryChart: React.FC<SensorHistoryChartProps> = ({
  history,
  threshold,
  thresholdLow = 1650,
  maxSamples = 60,
}) => {
  // Calculate rolling statistics
  const stats = useMemo(() => {
    if (history.length === 0) return { min: 0, max: 0, avg: 0, current: 0 };
    const values = history.map((h) => h.adc);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const current = values[values.length - 1];
    return { min, max, avg, current };
  }, [history]);

  // Determine dynamic Y-domain
  const yDomain = useMemo(() => {
    if (history.length === 0) return [0, 4095];
    const dataMin = stats.min;
    const dataMax = Math.max(stats.max, threshold + 200);
    const floor = Math.max(0, Math.floor(dataMin / 100) * 100 - 100);
    const ceil = Math.min(4095, Math.ceil(dataMax / 100) * 100 + 100);
    return [floor, ceil];
  }, [history.length, stats.min, stats.max, threshold]);

  // CSV Exporter
  const handleExportCsv = () => {
    if (history.length === 0) return;
    const header = 'Timestamp,Time,ADC,PinVoltage(V),SensorVoltage(V),TripThreshold,ResetThreshold\n';
    const rows = history
      .map((h) => {
        const pinVolt = ((h.adc / 4095) * 3.3).toFixed(2);
        const sensorVolt = (Number(pinVolt) / 0.625).toFixed(2);
        return `${h.timestamp},"${h.timeLabel}",${h.adc},${pinVolt},${sensorVolt},${threshold},${thresholdLow}`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aeris-telemetry-${new Date().toISOString().slice(0, 19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="bg-white border border-aeris-border rounded-xl p-5 sm:p-6 shadow-xs">
      {/* Header & Stats Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-[11px] font-mono font-medium tracking-widest text-aeris-secondary uppercase">
              Sensor Telemetry History
            </h3>
            <span className="text-[10px] font-mono text-aeris-secondary/60">
              ({history.length}/{maxSamples} samples)
            </span>
          </div>
          <p className="text-[10px] text-aeris-secondary font-mono mt-0.5">
            Real-time 12-bit ADC stream · 1000ms polling rate
          </p>
        </div>

        {/* Quick CSV Export & Live Stats */}
        <div className="flex items-center space-x-2.5">
          {history.length >= 2 && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-aeris-surface hover:bg-aeris-surfaceHover border border-aeris-border text-[10px] font-mono text-aeris-primary transition-colors"
              title="Download CSV of current rolling samples"
            >
              <Download className="w-3 h-3 text-aeris-secondary" />
              <span>Export CSV</span>
            </button>
          )}

          {history.length >= 2 && (
            <div className="flex items-center space-x-2 text-xs font-mono text-aeris-secondary bg-aeris-surface/60 px-2.5 py-1 rounded border border-aeris-border/60">
              <div>
                <span className="text-[9px] uppercase text-aeris-secondary/70">Min: </span>
                <span className="font-semibold text-aeris-primary">{stats.min}</span>
              </div>
              <span className="text-aeris-border">|</span>
              <div>
                <span className="text-[9px] uppercase text-aeris-secondary/70">Avg: </span>
                <span className="font-semibold text-aeris-primary">{stats.avg}</span>
              </div>
              <span className="text-aeris-border">|</span>
              <div>
                <span className="text-[9px] uppercase text-aeris-secondary/70">Max: </span>
                <span className="font-semibold text-aeris-primary">{stats.max}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 w-full pt-1">
        {history.length < 2 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-aeris-border rounded-lg bg-aeris-surface/40">
            <Activity className="w-5 h-5 text-aeris-secondary/60 mb-2 animate-pulse" />
            <p className="text-xs font-mono font-medium text-aeris-primary">
              Awaiting Telemetry Stream
            </p>
            <p className="text-[11px] font-mono text-aeris-secondary mt-1 max-w-xs">
              Collecting initial rolling samples from ESP32. Historical readings are not fabricated.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="timeLabel"
                stroke="#6B7280"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                axisLine={{ stroke: '#ECECEC' }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                domain={yDomain}
                stroke="#6B7280"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                axisLine={{ stroke: '#ECECEC' }}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ReadingHistoryPoint;
                    const volt = ((data.adc / 4095) * 3.3).toFixed(2);
                    const sensorVolt = (Number(volt) / 0.625).toFixed(2);
                    return (
                      <div className="bg-white border border-aeris-border px-3 py-2 rounded-md shadow-md font-mono text-[11px] space-y-0.5">
                        <div className="text-aeris-secondary text-[10px]">{data.timeLabel}</div>
                        <div className="flex items-center space-x-1.5 font-semibold text-aeris-primary">
                          <span>{data.adc} ADC</span>
                        </div>
                        <div className="text-[10px] text-aeris-secondary">
                          Pin: {volt}V · Sensor: {sensorVolt}V
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Hysteresis Clear Threshold Reference Line */}
              <ReferenceLine
                y={thresholdLow}
                stroke="#D97706"
                strokeDasharray="2 2"
                strokeWidth={1}
                label={{
                  value: `Reset: ${thresholdLow}`,
                  position: 'insideBottomRight',
                  fill: '#D97706',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />

              {/* Hysteresis Trip Threshold Reference Line */}
              <ReferenceLine
                y={threshold}
                stroke="#DC2626"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                label={{
                  value: `Trip: ${threshold}`,
                  position: 'insideTopRight',
                  fill: '#DC2626',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />

              {/* ADC Measurement Curve */}
              <Line
                type="monotone"
                dataKey="adc"
                stroke="#111111"
                strokeWidth={1.75}
                dot={false}
                activeDot={{ r: 3.5, fill: '#A85968', strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend & Scale Note */}
      <div className="mt-3.5 pt-3 border-t border-aeris-border/60 flex flex-wrap items-center justify-between text-[10px] font-mono text-aeris-secondary gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 bg-aeris-primary inline-block"></span>
            <span>Sensor ADC</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 border-t border-dashed border-red-600 inline-block"></span>
            <span>Trip ({threshold})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 border-t border-dotted border-amber-600 inline-block"></span>
            <span>Reset ({thresholdLow})</span>
          </div>
        </div>

        <span>Rolling 60s sample window</span>
      </div>
    </section>
  );
};
