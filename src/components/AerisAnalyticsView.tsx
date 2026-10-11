import React from 'react';
import {
  TrendingUp,
  Activity,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AerisAnalyticsViewProps {
  currentAdc?: number;
  threshold?: number;
}

export const AerisAnalyticsView: React.FC<AerisAnalyticsViewProps> = ({
  currentAdc = 842,
  threshold = 1800,
}) => {
  // Hourly distribution demo data
  const hourlyData = [
    { hour: '06:00', avg: 410, peak: 520 },
    { hour: '08:00', avg: 620, peak: 910 },
    { hour: '10:00', avg: 842, peak: 2260 },
    { hour: '12:00', avg: 710, peak: 890 },
    { hour: '14:00', avg: 650, peak: 780 },
    { hour: '16:00', avg: 690, peak: 840 },
    { hour: '18:00', avg: 780, peak: 1100 },
    { hour: '20:00', avg: 850, peak: 1350 },
    { hour: '22:00', avg: 520, peak: 680 },
  ];

  // MQ-2 Gas Sensitivity breakdown
  const gasSensitivities = [
    { name: 'LPG / Butane', curve: 'High (0.2 - 10 ppm)', status: 'Safe', riskScore: 12 },
    { name: 'Methane (CH4)', curve: 'Moderate (0.5 - 10 ppm)', status: 'Safe', riskScore: 18 },
    { name: 'Smoke / Combustion', curve: 'Very High (1 - 20 ppm)', status: 'Safe', riskScore: 15 },
    { name: 'Carbon Monoxide (CO)', curve: 'Low Sensitivity', status: 'Safe', riskScore: 8 },
    { name: 'Alcohol / Vapors', curve: 'Moderate (0.1 - 5 ppm)', status: 'Safe', riskScore: 10 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-aeris-border p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-aeris-textSecondary">
            <TrendingUp className="w-4 h-4 text-[#4E8168]" />
            <span className="text-xs font-extrabold uppercase tracking-[0.25em]">
              Sensor Intelligence
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal mt-2">
            Air Quality & Gas Analytics
          </h1>
          <p className="text-xs sm:text-sm text-aeris-textSecondary mt-1">
            Historical trends, sensor sensitivity characteristics, and environmental health metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 rounded-2xl bg-[#EDE9E1] border border-[#E0D9CE] text-center">
            <div className="text-[10px] font-bold text-aeris-textSecondary uppercase">
              Current / Limit
            </div>
            <div className="text-lg font-extrabold text-[#1A1D20] tabular-nums">
              {currentAdc} / {threshold}
            </div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#EFF5F1] border border-[#DFECE3] text-center">
            <div className="text-[10px] font-bold text-aeris-textSecondary uppercase">
              24H Peak
            </div>
            <div className="text-lg font-extrabold text-[#C94A4A] tabular-nums">
              2260 <span className="text-[10px] font-medium text-gray-500">ADC</span>
            </div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#EDE9E1] border border-[#E0D9CE] text-center hidden sm:block">
            <div className="text-[10px] font-bold text-aeris-textSecondary uppercase">
              Compliance
            </div>
            <div className="text-lg font-extrabold text-[#4E8168]">
              98.4%
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Card 1: 24-Hour Peak & Average Gas Distribution Chart */}
        <div className="bg-white rounded-3xl border border-aeris-border p-6 sm:p-8 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <BarChart3 className="w-4 h-4 text-aeris-textSecondary" />
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1A1D20]">
                Hourly Gas Exposure Distribution
              </span>
            </div>
            <span className="text-[11px] font-semibold text-aeris-textMuted">Today</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0ECE1" />
                <XAxis dataKey="hour" stroke="#8E9399" fontSize={11} tickLine={false} />
                <YAxis stroke="#8E9399" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #EAE4D9',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="avg" fill="#4E8168" radius={[4, 4, 0, 0]} name="Average ADC" />
                <Bar dataKey="peak" fill="#E2847A" radius={[4, 4, 0, 0]} name="Peak ADC" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center space-x-6 pt-4 border-t border-aeris-border text-xs text-aeris-textSecondary">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#4E8168]" />
              <span>Hourly Average</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#E2847A]" />
              <span>Peak Recorded Spike</span>
            </div>
          </div>
        </div>

        {/* Card 2: MQ-2 Target Gas Sensitivity Matrix */}
        <div className="bg-white rounded-3xl border border-aeris-border p-6 sm:p-8 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
            <div className="flex items-center space-x-2.5">
              <Activity className="w-4 h-4 text-aeris-textSecondary" />
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1A1D20]">
                MQ-2 Target Gas Profile
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#4E8168] uppercase bg-[#EFF5F1] px-2.5 py-0.5 rounded-full">
              Calibrated
            </span>
          </div>

          <div className="divide-y divide-[#F7F4EE] my-2">
            {gasSensitivities.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#1A1D20]">{item.name}</div>
                  <div className="text-[11px] text-aeris-textMuted mt-0.5">{item.curve}</div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#4E8168]">
                    <span className="w-2 h-2 rounded-full bg-[#4E8168]" />
                    <span>{item.status}</span>
                  </span>
                  <div className="text-[10px] text-aeris-textMuted mt-0.5">
                    Exposure: {item.riskScore}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-aeris-border text-[11px] text-aeris-textSecondary flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-[#9E4A3B] shrink-0" />
            <span>
              The tin dioxide (SnO2) sensitive layer changes conductance proportionally to combustible gases.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
