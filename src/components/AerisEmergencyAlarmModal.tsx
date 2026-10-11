import React from 'react';
import {
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  Wind,
  PowerOff,
  Users,
} from 'lucide-react';

interface AerisEmergencyAlarmModalProps {
  isOpen: boolean;
  adc: number;
  threshold: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onDismiss: () => void;
}

export const AerisEmergencyAlarmModal: React.FC<AerisEmergencyAlarmModalProps> = ({
  isOpen,
  adc,
  threshold,
  isMuted,
  onToggleMute,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none animate-fade-in">
      {/* Outer Pulse Border */}
      <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-[#C94A4A] shadow-[0_0_50px_rgba(201,74,74,0.4)] overflow-hidden relative">
        {/* Top Hazard Strobe Banner */}
        <div className="bg-[#C94A4A] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/20 animate-pulse">
              <Flame className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase">
                Gas Leakage Detected!
              </h2>
              <p className="text-[11px] text-white/90 font-medium">
                Immediate Hazard · Sensor Limit Exceeded
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white"
            title="Dismiss popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Reading Comparison Box */}
          <div className="bg-[#FDF2F2] rounded-2xl border border-[#F8D2D2] p-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#C94A4A]">
                Current Gas Reading
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#C94A4A] mt-1 tabular-nums">
                {adc} <span className="text-sm font-bold text-gray-600">ADC</span>
              </div>
            </div>

            <div className="text-right border-l border-[#F8D2D2] pl-6">
              <div className="text-[11px] font-bold uppercase tracking-wider text-aeris-textMuted">
                Safety Threshold
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1A1D20] mt-1 tabular-nums">
                {threshold} <span className="text-xs font-bold text-gray-500">ADC</span>
              </div>
              <div className="text-[10px] font-bold text-red-600 mt-1 uppercase">
                +{adc - threshold > 0 ? adc - threshold : 0} Above Limit
              </div>
            </div>
          </div>

          {/* Active Hardware Actuators Note */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-aeris-border text-xs">
            <div className="flex items-center space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-[#C94A4A] shrink-0" />
              <span className="font-semibold text-[#1A1D20]">
                Hardware Alarm Active:
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-extrabold text-[#C94A4A]">
              <span>Buzzer ON (GPIO 23)</span>
              <span>·</span>
              <span>Red LED ON (GPIO 19)</span>
            </div>
          </div>

          {/* Recommended Emergency Safety Protocol */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-aeris-textSecondary">
              Emergency Safety Checklist:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white border border-aeris-border flex flex-col items-center text-center space-y-1.5 shadow-2xs">
                <PowerOff className="w-4 h-4 text-[#C94A4A]" />
                <span className="font-bold text-[#1A1D20]">1. Gas Valve</span>
                <span className="text-[10px] text-aeris-textMuted leading-tight">
                  Shut off primary gas line immediately
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-aeris-border flex flex-col items-center text-center space-y-1.5 shadow-2xs">
                <Wind className="w-4 h-4 text-[#4E8168]" />
                <span className="font-bold text-[#1A1D20]">2. Ventilate</span>
                <span className="text-[10px] text-aeris-textMuted leading-tight">
                  Open all doors & windows to fresh air
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-aeris-border flex flex-col items-center text-center space-y-1.5 shadow-2xs">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-[#1A1D20]">3. Evacuate</span>
                <span className="text-[10px] text-aeris-textMuted leading-tight">
                  Clear area; avoid electrical switches
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {/* Audio Mute/Unmute */}
            <button
              onClick={onToggleMute}
              className={`w-full sm:w-auto flex-1 inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                isMuted
                  ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-gray-600" />
                  <span>Unmute Alarm Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-red-600 animate-bounce" />
                  <span>Silence Alarm Audio</span>
                </>
              )}
            </button>

            {/* Acknowledge Button */}
            <button
              onClick={onDismiss}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-[#1A1D20] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Acknowledge Hazard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
