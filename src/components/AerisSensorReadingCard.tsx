import React from 'react';
import { Sliders } from 'lucide-react';

interface AerisSensorReadingCardProps {
  adc: number;
  maxAdc?: number;
  isAlarm: boolean;
  minToday?: number;
  avgToday?: number;
  maxToday?: number;
}

export const AerisSensorReadingCard: React.FC<AerisSensorReadingCardProps> = ({
  adc,
  maxAdc = 4095,
  isAlarm,
  minToday = 420,
  avgToday = 892,
  maxToday = 2260,
}) => {
  const radius = 95;
  const strokeWidth = 22;
  const arcLength = Math.PI * radius; // 298.45

  const progress = Math.min(1, Math.max(0, adc / maxAdc));
  const strokeDashoffset = arcLength * (1 - progress);

  const trackColor = isAlarm ? '#F7E7E7' : '#E8ECE9';
  const fillColor = isAlarm ? '#C94A4A' : '#4E8168';

  return (
    <div className="bg-white rounded-3xl border border-aeris-border p-6 sm:p-8 shadow-card flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-aeris-textSecondary" />
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1A1D20]">
            Sensor Reading
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#EDE9E1] text-[11px] font-bold tracking-wider text-aeris-textSecondary uppercase">
          ADC
        </span>
      </div>

      {/* Semicircular Arc Gauge */}
      <div className="my-4 flex flex-col items-center justify-center relative">
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[260/155] flex items-center justify-center">
          <svg viewBox="0 0 260 155" className="w-full h-full overflow-visible">
            {/* Background Track */}
            <path
              d="M 35 135 A 95 95 0 0 1 225 135"
              fill="none"
              stroke={trackColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Active Fill Track */}
            <path
              d="M 35 135 A 95 95 0 0 1 225 135"
              fill="none"
              stroke={fillColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Center Typography */}
          <div className="absolute inset-0 top-[22%] flex flex-col items-center justify-center text-center">
            <span
              className={`text-5xl sm:text-6xl font-extrabold tracking-tight tabular-nums transition-colors duration-300 ${
                isAlarm ? 'text-[#C94A4A]' : 'text-[#1A1D20]'
              }`}
            >
              {adc}
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#1A1D20] mt-1">
              ADC Counts
            </span>
            <span className="text-[11px] font-medium text-aeris-textMuted mt-0.5">
              out of 4095
            </span>
          </div>
        </div>
      </div>

      {/* Bottom 3 Summary Stats (Separated by subtle dividers) */}
      <div className="grid grid-cols-3 pt-4 border-t border-aeris-border text-center">
        {/* MIN */}
        <div className="px-2">
          <div className="text-[10px] font-semibold text-aeris-textMuted uppercase tracking-wider">
            MIN (Today)
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#1A1D20] mt-1 tabular-nums">
            {minToday}
          </div>
        </div>

        {/* AVG */}
        <div className="px-2 border-x border-aeris-border">
          <div className="text-[10px] font-semibold text-aeris-textMuted uppercase tracking-wider">
            AVG (Today)
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#1A1D20] mt-1 tabular-nums">
            {avgToday}
          </div>
        </div>

        {/* MAX */}
        <div className="px-2">
          <div className="text-[10px] font-semibold text-aeris-textMuted uppercase tracking-wider">
            MAX (Today)
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold mt-1 tabular-nums ${
              maxToday >= 1800 ? 'text-[#C94A4A]' : 'text-[#1A1D20]'
            }`}
          >
            {maxToday}
          </div>
        </div>
      </div>
    </div>
  );
};
