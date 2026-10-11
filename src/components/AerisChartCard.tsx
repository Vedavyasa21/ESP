import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { ReadingHistoryPoint } from '../types';

interface AerisChartCardProps {
  history: ReadingHistoryPoint[];
  threshold: number;
  isAlarm: boolean;
  isMobile?: boolean;
}

export const AerisChartCard: React.FC<AerisChartCardProps> = ({
  history,
  threshold = 1800,
  isAlarm,
  isMobile = false,
}) => {
  const strokeColor = isAlarm ? '#D14343' : '#588E75';
  const fillColor = isAlarm ? '#FEECEC' : '#EAF3EE';

  // Ensure minimum points for a smooth visual curve matching screenshot
  const displayData = history.length >= 2 ? history : [
    { timeLabel: '10:00', adc: 980 },
    { timeLabel: '10:05', adc: 1250 },
    { timeLabel: '10:10', adc: 1120 },
    { timeLabel: '10:15', adc: 1420 },
    { timeLabel: '10:20', adc: 1180 },
    { timeLabel: '10:25', adc: 1100 },
    { timeLabel: '10:30', adc: 1248 },
  ];

  return (
    <div className="bg-white rounded-2xl lg:rounded-3xl border border-aeris-border p-6 lg:p-8 shadow-card">
      {/* Header & Legend */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm sm:text-base font-bold text-[#17191C] tracking-tight">
          {isMobile ? 'Live Reading' : 'Gas Reading (Last 30 Minutes)'}
        </h3>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-semibold text-aeris-textSecondary">
          <div className="flex items-center space-x-1.5">
            <span
              className="w-3 h-0.5 rounded-full inline-block"
              style={{ backgroundColor: strokeColor }}
            />
            <span>ADC Value</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-red-500 inline-block" />
            <span>Threshold</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas - expanded height on desktop */}
      <div className="h-56 sm:h-64 lg:h-72 xl:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={displayData}
            margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="aerisGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="timeLabel"
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#ECEAE6' }}
              minTickGap={25}
            />
            <YAxis
              domain={[0, 4000]}
              ticks={[0, 1000, 2000, 3000, 4000]}
              stroke="#9CA3AF"
              fontSize={11}
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
                      <span className="text-aeris-textSecondary">ADC: </span>
                      <strong className="text-sm font-extrabold">{val}</strong>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Threshold Reference Line */}
            <ReferenceLine
              y={threshold}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Main Area & Curve */}
            <Area
              type="monotone"
              dataKey="adc"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill="url(#aerisGradient)"
              dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: strokeColor, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
