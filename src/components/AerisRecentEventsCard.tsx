import React from 'react';
import { History } from 'lucide-react';
import { ESPTelemetry } from '../types';

export interface RecentEventItem {
  id?: string;
  timeStr: string;
  event: string;
  adc: number;
  status: 'Normal' | 'High' | 'Warning';
}

interface AerisRecentEventsCardProps {
  events?: RecentEventItem[];
  onViewAll?: () => void;
  currentReading?: Partial<ESPTelemetry> | null;
}

const DEFAULT_EVENTS: RecentEventItem[] = [
  { timeStr: '10:30:12 AM', event: 'Gas level normal', adc: 842, status: 'Normal' },
  { timeStr: '10:29:12 AM', event: 'Gas level normal', adc: 910, status: 'Normal' },
  { timeStr: '10:28:12 AM', event: 'Gas level normal', adc: 876, status: 'Normal' },
  { timeStr: '10:20:14 AM', event: 'Threshold exceeded', adc: 2260, status: 'High' },
  { timeStr: '10:19:12 AM', event: 'Gas level normal', adc: 1100, status: 'Normal' },
];

export const AerisRecentEventsCard: React.FC<AerisRecentEventsCardProps> = ({
  events = DEFAULT_EVENTS,
  onViewAll,
}) => {
  const displayEvents = events.length > 0 ? events.slice(0, 5) : DEFAULT_EVENTS;

  return (
    <div className="bg-white rounded-3xl border border-aeris-border p-6 sm:p-7 shadow-card flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center space-x-2.5">
          <History className="w-4 h-4 text-aeris-textSecondary" />
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1A1D20]">
            Recent Events
          </span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-[#A85968] hover:text-[#8C3D4D] transition-colors cursor-pointer underline underline-offset-4"
          >
            View All
          </button>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#ECE7DD] text-[10px] font-extrabold uppercase tracking-wider text-aeris-textMuted">
              <th className="py-2.5 font-bold">Time</th>
              <th className="py-2.5 font-bold">Event</th>
              <th className="py-2.5 font-bold text-center">ADC Value</th>
              <th className="py-2.5 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F2EB]">
            {displayEvents.map((item, idx) => {
              const isAlert = item.status === 'High';
              return (
                <tr
                  key={item.id || idx}
                  className={`transition-colors hover:bg-[#FAF8F5]/80 ${
                    isAlert ? 'bg-[#FCF6F6]' : ''
                  }`}
                >
                  <td className="py-3 font-medium text-aeris-textSecondary tabular-nums whitespace-nowrap">
                    {item.timeStr}
                  </td>
                  <td
                    className={`py-3 font-semibold ${
                      isAlert ? 'text-[#C94A4A]' : 'text-[#2A2E33]'
                    }`}
                  >
                    {item.event}
                  </td>
                  <td
                    className={`py-3 text-center font-extrabold tabular-nums ${
                      isAlert ? 'text-[#C94A4A]' : 'text-[#2A2E33]'
                    }`}
                  >
                    {item.adc}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`inline-flex items-center space-x-1.5 text-xs font-bold ${
                        isAlert ? 'text-[#C94A4A]' : 'text-[#4E8168]'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAlert ? 'bg-[#C94A4A]' : 'bg-[#4E8168]'
                        }`}
                      />
                      <span>{item.status}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
