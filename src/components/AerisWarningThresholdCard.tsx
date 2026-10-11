import React from 'react';
import { Sliders, Minus, Plus } from 'lucide-react';

interface AerisWarningThresholdCardProps {
  threshold: number;
  onThresholdChange?: (newThreshold: number) => void;
  isAlarm: boolean;
}

export const AerisWarningThresholdCard: React.FC<AerisWarningThresholdCardProps> = ({
  threshold,
  onThresholdChange,
  isAlarm,
}) => {
  const minRange = 500;
  const maxRange = 3500;
  const percentage = Math.min(
    100,
    Math.max(0, ((threshold - minRange) / (maxRange - minRange)) * 100)
  );

  const fillColor = isAlarm ? 'bg-[#C94A4A]' : 'bg-[#4E8168]';
  const handleColor = isAlarm ? 'bg-[#991B1B]' : 'bg-[#2A2E33]';

  const adjust = (delta: number) => {
    if (!onThresholdChange) return;
    const nextVal = Math.min(maxRange, Math.max(minRange, threshold + delta));
    onThresholdChange(nextVal);
  };

  return (
    <div className="bg-white rounded-3xl border border-aeris-border p-6 shadow-card flex flex-col justify-between select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-aeris-textSecondary" />
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1A1D20]">
            Warning Threshold
          </span>
        </div>

        {/* Quick adjustments +/- */}
        {onThresholdChange && (
          <div className="flex items-center space-x-1 opacity-70 hover:opacity-100 transition-opacity">
            <button
              onClick={() => adjust(-50)}
              title="Decrease Threshold (-50 ADC)"
              className="p-1 rounded-md bg-[#FAF8F5] hover:bg-[#EDE9E1] text-aeris-textSecondary hover:text-black cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => adjust(50)}
              title="Increase Threshold (+50 ADC)"
              className="p-1 rounded-md bg-[#FAF8F5] hover:bg-[#EDE9E1] text-aeris-textSecondary hover:text-black cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Reading Value */}
      <div className="my-3 flex items-baseline space-x-2">
        <span className="text-3xl sm:text-4xl font-extrabold text-[#1A1D20] tracking-tight tabular-nums">
          {threshold}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-aeris-textSecondary">
          ADC Counts
        </span>
      </div>

      {/* Slider Track with Capsule Handle */}
      <div className="relative mt-2 h-2.5 w-full bg-[#EAE4D9] rounded-full overflow-visible">
        {/* Active Fill Track */}
        <div
          className={`h-full rounded-full transition-all duration-150 ${fillColor}`}
          style={{ width: `${percentage}%` }}
        />

        {/* Vertical Capsule Slider Handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-2 h-5 rounded-full ${handleColor} shadow-xs z-10 transition-all pointer-events-none`}
          style={{ left: `calc(${percentage}% - 4px)` }}
        />

        {/* Native Range Input for direct dragging */}
        {onThresholdChange && (
          <input
            type="range"
            min={minRange}
            max={maxRange}
            step={10}
            value={threshold}
            onChange={(e) => onThresholdChange(parseInt(e.target.value, 10))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            title={`Slide to adjust threshold (${threshold} ADC)`}
          />
        )}
      </div>

      {/* Range Min/Max and Recommendation */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-aeris-textMuted mt-2">
        <span>{minRange}</span>
        <span className="text-[10px] font-medium text-aeris-textSecondary">
          Recommended range: 1000 – 3000
        </span>
        <span>{maxRange}</span>
      </div>
    </div>
  );
};
