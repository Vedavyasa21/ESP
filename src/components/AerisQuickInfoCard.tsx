import React from 'react';
import { Info, FileText, ArrowRight } from 'lucide-react';

interface AerisQuickInfoCardProps {
  onLearnMore?: () => void;
}

export const AerisQuickInfoCard: React.FC<AerisQuickInfoCardProps> = ({
  onLearnMore,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-aeris-border p-6 sm:p-7 shadow-card flex flex-col justify-between select-none">
      {/* Header */}
      <div className="flex items-center space-x-2.5 pb-3">
        <Info className="w-4 h-4 text-aeris-textSecondary" />
        <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1A1D20]">
          Quick Info
        </span>
      </div>

      {/* Educational Notice */}
      <p className="text-xs text-aeris-textSecondary leading-relaxed my-2">
        ADC readings are relative sensor values, not calibrated gas concentration in ppm. This is an educational prototype, not a certified gas safety device.
      </p>

      {/* Bottom Terracotta Link Banner */}
      <button
        onClick={onLearnMore}
        className="mt-3 w-full p-3.5 rounded-2xl bg-[#F9ECE7] border border-[#F2DDD6] hover:bg-[#F5E4DD] transition-all flex items-center justify-between group cursor-pointer text-left"
        title="View AERIS ESP32 documentation & pinout"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-white/80 text-[#984A3B] group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-extrabold tracking-wider text-[#984A3B] uppercase">
              AERIS · ESP32 GAS MONITOR
            </div>
            <div className="text-[10px] text-[#A06C62] font-medium mt-0.5">
              Monitor. Detect. Stay Aware.
            </div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-[#984A3B] group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
