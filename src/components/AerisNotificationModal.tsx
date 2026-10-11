import React from 'react';
import { Bell, X, Flame, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AerisNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAlarm: boolean;
}

export const AerisNotificationModal: React.FC<AerisNotificationModalProps> = ({
  isOpen,
  onClose,
  isAlarm,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: '1',
      title: isAlarm ? 'CRITICAL: Gas Leakage Detected' : 'Threshold Exceeded Alert',
      desc: isAlarm
        ? 'Gas reading has exceeded warning threshold. Buzzer and Red LED triggered!'
        : 'Gas sensor recorded 2260 ADC Counts exceeding safety limit (1800 ADC).',
      time: '10:20:14 AM',
      type: 'alarm',
      unread: true,
    },
    {
      id: '2',
      title: 'Gas Level Normalized',
      desc: 'Gas readings stabilized at 842 ADC. Green indicator engaged.',
      time: '10:25:12 AM',
      type: 'safe',
      unread: false,
    },
    {
      id: '3',
      title: 'ESP32 Wi-Fi Connected',
      desc: 'Hardware client associated with Local Wi-Fi (IP: 192.168.1.85).',
      time: '09:45:30 AM',
      type: 'info',
      unread: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-aeris-border p-6 sm:p-7 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#FAF8F5] text-[#1A1D20]">
              <Bell className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1D20]">
                Notifications Center
              </h2>
              <p className="text-[11px] text-aeris-textSecondary">
                {isAlarm ? 'Warning: Active gas hazard in progress' : 'System alerts and hardware transition events'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-aeris-textSecondary hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                item.type === 'alarm'
                  ? 'bg-[#FDF2F2] border-[#F8D2D2]'
                  : 'bg-[#FAF8F5] border-[#EAE4D9]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {item.type === 'alarm' ? (
                    <Flame className="w-4 h-4 text-[#C94A4A] shrink-0" />
                  ) : item.type === 'safe' ? (
                    <ShieldCheck className="w-4 h-4 text-[#4E8168] shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-aeris-textSecondary shrink-0" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      item.type === 'alarm' ? 'text-[#C94A4A]' : 'text-[#1A1D20]'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
                <span className="text-[10px] text-aeris-textMuted font-medium tabular-nums">
                  {item.time}
                </span>
              </div>
              <p className="text-xs text-aeris-textSecondary mt-1 leading-relaxed pl-6">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1A1D20] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
          >
            Dismiss All
          </button>
        </div>
      </div>
    </div>
  );
};
