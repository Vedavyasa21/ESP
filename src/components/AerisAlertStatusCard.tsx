import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface AerisAlertStatusCardProps {
  isAlarm: boolean;
  threshold?: number;
  currentAdc?: number;
  onSimulateAlarm?: () => void;
  onClearAlarm?: () => void;
}

export const AerisAlertStatusCard: React.FC<AerisAlertStatusCardProps> = ({
  isAlarm,
  threshold = 1800,
  currentAdc = 842,
  onSimulateAlarm,
  onClearAlarm,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-aeris-border p-6 sm:p-7 shadow-card flex flex-col justify-between select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center space-x-2.5">
          {isAlarm ? (
            <ShieldAlert className="w-4 h-4 text-[#C94A4A]" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-aeris-textSecondary" />
          )}
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1A1D20]">
            Alert Status
          </span>
        </div>
      </div>

      {/* Status Box Container */}
      <div
        className={`my-auto rounded-2xl p-5 border transition-all duration-300 ${
          isAlarm
            ? 'bg-[#FDF2F2] border-[#F8D2D2]'
            : 'bg-[#EFF5F1] border-[#DFECE3]'
        }`}
      >
        <div className="flex items-start space-x-3.5">
          <span
            className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
              isAlarm
                ? 'bg-[#C94A4A] shadow-[0_0_8px_rgba(201,74,74,0.7)] animate-pulse'
                : 'bg-[#4E8168] shadow-[0_0_8px_rgba(78,129,104,0.5)]'
            }`}
          />
          <div className="space-y-1">
            <h3
              className={`text-sm font-extrabold uppercase tracking-wider ${
                isAlarm ? 'text-[#C94A4A]' : 'text-[#1A1D20]'
              }`}
            >
              {isAlarm ? 'Alert Active' : 'No Alert'}
            </h3>
            <p className="text-xs text-aeris-textSecondary leading-relaxed">
              {isAlarm
                ? `Gas level (${currentAdc}) has exceeded the safety threshold of ${threshold} ADC.`
                : 'Gas level is below the configured threshold.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Simulation Shortcut */}
      <div className="pt-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-aeris-textMuted uppercase tracking-wider">
          Safety Interlock
        </span>
        {isAlarm ? (
          <button
            onClick={onClearAlarm}
            className="text-[11px] font-bold text-[#4E8168] hover:underline cursor-pointer"
          >
            Acknowledge & Reset
          </button>
        ) : (
          <button
            onClick={onSimulateAlarm}
            className="text-[11px] font-bold text-[#A85968] hover:underline cursor-pointer"
          >
            Test Alarm Response
          </button>
        )}
      </div>
    </div>
  );
};
