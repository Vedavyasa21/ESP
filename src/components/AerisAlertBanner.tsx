import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AerisAlertBannerProps {
  isAlarm: boolean;
}

export const AerisAlertBanner: React.FC<AerisAlertBannerProps> = ({ isAlarm }) => {
  if (!isAlarm) return null;

  return (
    <div className="bg-[#FEECEC] border border-[#FCA5A5] rounded-2xl p-4 sm:p-4.5 mb-5 shadow-xs animate-fade-in flex items-start space-x-3.5">
      <div className="p-1.5 rounded-lg bg-red-100/80 text-red-600 shrink-0 mt-0.5">
        <AlertTriangle className="w-5 h-5 fill-red-600/20 stroke-[2.2]" />
      </div>
      <div>
        <h3 className="text-sm sm:text-base font-bold text-[#991B1B] tracking-tight">
          Gas Leakage Detected!
        </h3>
        <p className="text-xs text-[#7F1D1D] mt-0.5">
          Gas level has exceeded the threshold.
        </p>
      </div>
    </div>
  );
};
