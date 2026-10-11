import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface AerisThresholdCardProps {
  threshold: number;
  maxAdc?: number;
  isAlarm: boolean;
  onThresholdChange?: (newThreshold: number) => void;
}

export const AerisThresholdCard: React.FC<AerisThresholdCardProps> = ({
  threshold,
  maxAdc = 4095,
  isAlarm,
  onThresholdChange,
}) => {
  const percentage = Math.min(100, Math.max(0, (threshold / maxAdc) * 100));
  const fillColor = isAlarm ? 'bg-[#D14343]' : 'bg-[#588E75]';
  const handleColor = isAlarm ? 'bg-[#991B1B]' : 'bg-[#2D3748]';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && onThresholdChange) {
      onThresholdChange(val);
    }
  };

  const adjustThreshold = (delta: number) => {
    if (!onThresholdChange) return;
    const nextVal = Math.min(maxAdc, Math.max(200, threshold + delta));
    onThresholdChange(nextVal);
  };

  return (
    <div className="bg-white rounded-2xl lg:rounded-3xl border border-aeris-border p-6 lg:p-7 shadow-card transition-all relative group hover:border-[#588E75]/30">
      <div className="flex items-center justify-between">
        <div className="text-xs lg:text-sm text-aeris-textSecondary font-semibold">
          Threshold
        </div>

        {/* Interactive +/- Buttons */}
        {onThresholdChange && (
          <div className="flex items-center space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => adjustThreshold(-50)}
              title="Decrease Threshold (-50 ADC)"
              className="p-1.5 rounded-lg bg-[#F7F5F2] hover:bg-[#ECEAE6] text-aeris-textSecondary hover:text-black transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => adjustThreshold(50)}
              title="Increase Threshold (+50 ADC)"
              className="p-1.5 rounded-lg bg-[#F7F5F2] hover:bg-[#ECEAE6] text-aeris-textSecondary hover:text-black transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div className="text-3xl lg:text-4xl font-extrabold text-[#17191C] tracking-tight tabular-nums">
          {threshold}
        </div>
        <span className="text-xs text-aeris-textMuted font-medium">
          ADC limit
        </span>
      </div>

      {/* Horizontal Bar with Handle + Range Input Slider */}
      <div className="relative mt-5 h-3 w-full bg-[#EAE8E4] rounded-full overflow-visible">
        {/* Active Fill up to Threshold */}
        <div
          className={`h-full rounded-full transition-all duration-150 ${fillColor}`}
          style={{ width: `${percentage}%` }}
        />

        {/* Vertical Slider Handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-2 h-6 rounded-full ${handleColor} shadow-sm z-10 transition-all pointer-events-none`}
          style={{ left: `calc(${percentage}% - 4px)` }}
        />

        {/* Transparent Interactive Native Range Input overlay */}
        {onThresholdChange && (
          <input
            type="range"
            min={200}
            max={4000}
            step={10}
            value={threshold}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            title={`Slide to adjust threshold (Current: ${threshold})`}
          />
        )}
      </div>
    </div>
  );
};
