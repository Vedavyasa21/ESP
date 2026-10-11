import React from 'react';

interface AerisGaugeProps {
  adc: number;
  maxAdc?: number;
  isAlarm: boolean;
  isMobile?: boolean;
}

export const AerisGauge: React.FC<AerisGaugeProps> = ({
  adc,
  maxAdc = 4095,
  isAlarm,
  isMobile = false,
}) => {
  const radius = 95;
  const strokeWidth = 20;
  const arcLength = Math.PI * radius; // 298.45

  const progress = Math.min(1, Math.max(0, adc / maxAdc));
  const strokeDashoffset = arcLength * (1 - progress);

  const trackColor = isAlarm ? '#F3E4E4' : '#E4E7E4';
  const fillColor = isAlarm ? '#D14343' : '#588E75';

  return (
    <div className="flex flex-col items-center justify-center relative w-full select-none py-2 lg:py-4">
      {/* Semicircular SVG container - scaled up for desktop prominence */}
      <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] xl:max-w-[460px] aspect-[260/155] flex items-center justify-center">
        <svg
          viewBox="0 0 260 155"
          className="w-full h-full overflow-visible"
        >
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

        {/* Center Typography - commanding, large, and perfectly positioned */}
        <div className="absolute inset-0 top-[26%] flex flex-col items-center justify-center text-center">
          <span
            className={`text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-extrabold tracking-tight tabular-nums transition-colors duration-300 ${
              isAlarm ? 'text-[#B91C1C]' : 'text-[#17191C]'
            }`}
          >
            {adc}
          </span>
          <span className="text-xs sm:text-sm md:text-base font-semibold text-aeris-textSecondary mt-1">
            ADC Value
          </span>
          <span className="text-[11px] sm:text-xs md:text-sm text-aeris-textMuted mt-0.5 font-medium">
            {isMobile ? '/ 4095' : 'out of 4095'}
          </span>
        </div>
      </div>
    </div>
  );
};
