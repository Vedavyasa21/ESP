import React from 'react';
import { Leaf, Flame, ShieldCheck, AlertTriangle } from 'lucide-react';

interface AerisMiniStatusProps {
  isAlarm: boolean;
}

export const AerisMiniStatus: React.FC<AerisMiniStatusProps> = ({ isAlarm }) => {
  return (
    <div className="grid grid-cols-2 gap-4 lg:gap-6 w-full">
      {/* 1. Gas Level Mini Card */}
      <div className="bg-white rounded-2xl lg:rounded-3xl border border-aeris-border p-5 lg:p-6 shadow-card flex items-center space-x-4">
        <div
          className={`p-2.5 rounded-2xl transition-colors shrink-0 ${
            isAlarm
              ? 'bg-red-50 text-red-600'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {isAlarm ? (
            <Flame className="w-6 h-6 stroke-[1.8]" />
          ) : (
            <Leaf className="w-6 h-6 stroke-[1.8]" />
          )}
        </div>

        <div className="min-w-0">
          <div className="text-xs lg:text-sm text-aeris-textSecondary font-semibold leading-none">
            Gas Level
          </div>
          <div
            className={`text-base lg:text-xl font-bold mt-1.5 leading-none ${
              isAlarm ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {isAlarm ? 'High' : 'Normal'}
          </div>
        </div>
      </div>

      {/* 2. Air Quality Mini Card */}
      <div className="bg-white rounded-2xl lg:rounded-3xl border border-aeris-border p-5 lg:p-6 shadow-card flex items-center space-x-4">
        <div
          className={`p-2.5 rounded-2xl transition-colors shrink-0 ${
            isAlarm
              ? 'bg-red-50 text-red-600'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {isAlarm ? (
            <AlertTriangle className="w-6 h-6 stroke-[1.8]" />
          ) : (
            <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
          )}
        </div>

        <div className="min-w-0">
          <div className="text-xs lg:text-sm text-aeris-textSecondary font-semibold leading-none">
            Air Quality
          </div>
          <div
            className={`text-base lg:text-xl font-bold mt-1.5 leading-none ${
              isAlarm ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {isAlarm ? 'Unsafe' : 'Safe'}
          </div>
        </div>
      </div>
    </div>
  );
};
