import React, { useState } from 'react';
import { History, Download, Trash2, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import { ReadingHistoryPoint } from '../types';

interface AerisHistoryViewProps {
  history: ReadingHistoryPoint[];
  threshold: number;
  onClearHistory: () => void;
  onAddSample?: () => void;
}

export const AerisHistoryView: React.FC<AerisHistoryViewProps> = ({
  history,
  threshold,
  onClearHistory,
}) => {
  const [filterAlarmOnly, setFilterAlarmOnly] = useState<boolean>(false);

  // Statistics
  const adcValues = history.map((h) => h.adc);
  const peakAdc = adcValues.length > 0 ? Math.max(...adcValues) : 0;
  const avgAdc = adcValues.length > 0 ? Math.round(adcValues.reduce((a, b) => a + b, 0) / adcValues.length) : 0;
  const alarmEventsCount = history.filter((h) => h.adc >= threshold).length;

  const filteredHistory = filterAlarmOnly
    ? history.filter((h) => h.adc >= threshold)
    : history;

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Time', 'Raw_ADC', 'Threshold', 'Status', 'Air_Quality'];
    const rows = history.map((item) => [
      new Date(item.timestamp).toISOString(),
      item.timeLabel,
      item.adc,
      item.threshold,
      item.adc >= threshold ? 'HIGH' : 'NORMAL',
      item.adc >= threshold ? 'UNSAFE' : 'SAFE',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aeris-gas-telemetry-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17191C] flex items-center space-x-2.5">
            <History className="w-7 h-7 text-[#588E75]" />
            <span>Telemetry History & Incident Log</span>
          </h1>
          <p className="text-xs sm:text-sm text-aeris-textSecondary mt-1">
            Historical gas exposure logs, alarm transition records, and CSV export.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F7F5F2] text-[#17191C] border border-aeris-border text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onClearHistory}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-aeris-border text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-aeris-border p-5 shadow-card">
          <div className="text-xs text-aeris-textSecondary font-semibold">Peak Recorded ADC</div>
          <div className="text-3xl font-extrabold text-[#17191C] mt-1 tabular-nums">
            {peakAdc}
          </div>
          <div className="text-[11px] text-aeris-textMuted mt-1">
            {peakAdc >= threshold ? 'Exceeded threshold' : 'Within normal limits'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-aeris-border p-5 shadow-card">
          <div className="text-xs text-aeris-textSecondary font-semibold">Rolling Average ADC</div>
          <div className="text-3xl font-extrabold text-[#17191C] mt-1 tabular-nums">
            {avgAdc}
          </div>
          <div className="text-[11px] text-aeris-textMuted mt-1">
            Calculated across {history.length} samples
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-aeris-border p-5 shadow-card">
          <div className="text-xs text-aeris-textSecondary font-semibold">Trip Incidents</div>
          <div className={`text-3xl font-extrabold mt-1 tabular-nums ${alarmEventsCount > 0 ? 'text-[#D14343]' : 'text-[#588E75]'}`}>
            {alarmEventsCount}
          </div>
          <div className="text-[11px] text-aeris-textMuted mt-1">
            Readings &gt;= {threshold} ADC
          </div>
        </div>
      </div>

      {/* Log Table Container */}
      <div className="bg-white rounded-2xl border border-aeris-border shadow-card overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-aeris-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#17191C]">Recorded Data Points:</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F7F5F2] font-semibold text-aeris-textSecondary">
              {filteredHistory.length}
            </span>
          </div>

          <button
            onClick={() => setFilterAlarmOnly(!filterAlarmOnly)}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterAlarmOnly
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-[#F7F5F2] text-aeris-textSecondary hover:text-black border border-aeris-border'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>{filterAlarmOnly ? 'Show All Readings' : 'Filter Alarms Only'}</span>
          </button>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#FAF9F6] sticky top-0 border-b border-aeris-border z-10 text-aeris-textSecondary font-semibold">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">MQ-2 ADC Count</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Gas Level</th>
                <th className="py-3 px-4">Air Quality</th>
                <th className="py-3 px-4 text-right">Trip Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aeris-border">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-aeris-textSecondary">
                    No readings found in this filter range.
                  </td>
                </tr>
              ) : (
                filteredHistory
                  .slice()
                  .reverse()
                  .map((item) => {
                    const isItemAlarm = item.adc >= threshold;
                    return (
                      <tr key={item.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-aeris-textSecondary">
                          {item.timeLabel}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#17191C]">
                          {item.adc}
                        </td>
                        <td className="py-3 px-4 font-mono text-aeris-textMuted">
                          {threshold}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isItemAlarm
                                ? 'bg-red-50 text-red-700'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            <span>{isItemAlarm ? 'High' : 'Normal'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 text-[11px] font-semibold ${
                              isItemAlarm ? 'text-red-600' : 'text-[#588E75]'
                            }`}
                          >
                            {isItemAlarm ? (
                              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                            )}
                            <span>{isItemAlarm ? 'Unsafe' : 'Safe'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px]">
                          {isItemAlarm ? (
                            <span className="text-red-600 font-bold">ALARM TRIP</span>
                          ) : (
                            <span className="text-aeris-textMuted">Nominal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
