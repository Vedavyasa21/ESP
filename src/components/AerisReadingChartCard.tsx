import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import { ReadingHistoryPoint } from '../types';

interface AerisReadingChartCardProps {
  history: ReadingHistoryPoint[];
  threshold: number;
  isAlarm: boolean;
}

export const AerisReadingChartCard: React.FC<AerisReadingChartCardProps> = ({
  history,
  threshold = 1800,
  isAlarm,
}) => {
  const [timeRange, setTimeRange] = useState<string>('Last 30 Minutes');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const strokeColor = isAlarm ? '#C94A4A' : '#4E8168';
  const fillColor = isAlarm ? '#FDF2F2' : '#EDF4F0';

  const displayData =
    history.length >= 2
      ? history
      : [
          { timeLabel: '10:00', adc: 980 },
          { timeLabel: '10:05', adc: 1250 },
          { timeLabel: '10:10', adc: 1120 },
          { timeLabel: '10:15', adc: 1420 },
          { timeLabel: '10:20', adc: 1180 },
          { timeLabel: '10:25', adc: 1100 },
          { timeLabel: '10:30', adc: 842 },
        ];

  return (
    <div className="bg-white rounded-3xl border border-aeris-border p-6 sm:p-8 shadow-card flex flex-col justify-between select-none">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <TrendingUp className="w-4 h-4 text-aeris-textSecondary" />
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1A1D20]">
            Gas Reading Over Time
          </span>
        </div>

        {/* Time Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-aeris-border bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#1A1D20] transition-all cursor-pointer shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-aeris-textSecondary" />
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-aeris-textSecondary" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-2xl border border-aeris-border shadow-lg p-1.5 z-30 animate-fade-in text-xs">
              {['Last 30 Minutes', 'Last 1 Hour', 'Last 24 Hours'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                    timeRange === range
                      ? 'bg-[#EDE9E1] font-bold text-[#1A1D20]'
                      : 'hover:bg-[#FAF8F5] text-aeris-textSecondary'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas with Vertical Y-Axis Label */}
      <div className="relative w-full h-56 sm:h-64 lg:h-72 pt-2">
        {/* Vertical Axis Title */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold text-aeris-textMuted tracking-wider uppercase pointer-events-none">
          ADC Value
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={displayData}
            margin={{ top: 10, right: 10, left: 15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="aerisMainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="timeLabel"
              stroke="#9BA1A8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#EAE4D9' }}
              minTickGap={25}
            />
            <YAxis
              domain={[0, 4000]}
              ticks={[0, 1000, 2000, 3000, 4000]}
              stroke="#9BA1A8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value;
                  return (
                    <div className="bg-white border border-aeris-border px-3 py-2 rounded-xl shadow-md text-xs font-medium text-aeris-textPrimary">
                      <span className="text-aeris-textSecondary">Reading: </span>
                      <strong className="text-sm font-extrabold">{val} ADC</strong>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Threshold Reference Line */}
            <ReferenceLine
              y={threshold}
              stroke="#C94A4A"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Main Area Curve */}
            <Area
              type="monotone"
              dataKey="adc"
              stroke={strokeColor}
              strokeWidth={2.2}
              fill="url(#aerisMainGrad)"
              dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: strokeColor, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Footer Centered */}
      <div className="flex items-center justify-center space-x-6 pt-3 text-xs font-semibold text-aeris-textSecondary">
        <div className="flex items-center space-x-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: strokeColor }}
          />
          <span className="text-[11px] font-bold text-[#1A1D20]">ADC Value</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-0.5 border-t border-dashed border-[#C94A4A] inline-block" />
          <span className="text-[11px] text-[#C94A4A] font-bold">Threshold ({threshold})</span>
        </div>
      </div>
    </div>
  );
};
