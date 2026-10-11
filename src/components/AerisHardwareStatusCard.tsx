import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { InferredHardwareState } from '../types';

interface AerisHardwareStatusCardProps {
  hardwareState: InferredHardwareState;
  isOnline: boolean;
  onTestBuzzer?: () => void;
  onTestRedLed?: () => void;
  onTestGreenLed?: () => void;
}

export const AerisHardwareStatusCard: React.FC<AerisHardwareStatusCardProps> = ({
  hardwareState,
  isOnline,
  onTestBuzzer,
  onTestRedLed,
  onTestGreenLed,
}) => {
  const { greenLed, redLed, buzzer } = hardwareState;
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const handleGreenClick = () => {
    setActiveFeedback('green');
    onTestGreenLed?.();
    setTimeout(() => setActiveFeedback(null), 1200);
  };

  const handleRedClick = () => {
    setActiveFeedback('red');
    onTestRedLed?.();
    setTimeout(() => setActiveFeedback(null), 1200);
  };

  const handleBuzzerClick = () => {
    setActiveFeedback('buzzer');
    onTestBuzzer?.();
    setTimeout(() => setActiveFeedback(null), 1200);
  };

  return (
    <div className="bg-white rounded-3xl border border-aeris-border p-6 shadow-card flex flex-col justify-between select-none">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Cpu className="w-4 h-4 text-aeris-textSecondary" />
        <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1A1D20]">
          Hardware Status
        </span>
      </div>

      {/* 3 Status Rows */}
      <div className="my-3 space-y-3">
        {/* Row 1: Green LED */}
        <button
          onClick={handleGreenClick}
          title="Click to test Green Safe LED"
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center space-x-3">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                (greenLed.active && isOnline) || activeFeedback === 'green'
                  ? 'bg-[#4E8168] shadow-[0_0_8px_rgba(78,129,104,0.7)]'
                  : 'bg-[#C4C4C4]'
              }`}
            />
            <span className="text-xs font-semibold text-[#1A1D20]">Green LED</span>
          </div>
          <span
            className={`text-xs font-extrabold uppercase tracking-wider ${
              (greenLed.active && isOnline) || activeFeedback === 'green'
                ? 'text-[#4E8168]'
                : 'text-aeris-textSecondary'
            }`}
          >
            {(greenLed.active && isOnline) || activeFeedback === 'green' ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Row 2: Red LED */}
        <button
          onClick={handleRedClick}
          title="Click to test Red Alert LED"
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center space-x-3">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                (redLed.active && isOnline) || activeFeedback === 'red'
                  ? 'bg-[#C94A4A] shadow-[0_0_8px_rgba(201,74,74,0.7)] animate-pulse'
                  : 'bg-[#C4C4C4]'
              }`}
            />
            <span className="text-xs font-semibold text-[#1A1D20]">Red LED</span>
          </div>
          <span
            className={`text-xs font-extrabold uppercase tracking-wider ${
              (redLed.active && isOnline) || activeFeedback === 'red'
                ? 'text-[#C94A4A]'
                : 'text-aeris-textSecondary'
            }`}
          >
            {(redLed.active && isOnline) || activeFeedback === 'red' ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Row 3: Buzzer */}
        <button
          onClick={handleBuzzerClick}
          title="Click to test Active Buzzer Audio Tone"
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center space-x-3">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                (buzzer.active && isOnline) || activeFeedback === 'buzzer'
                  ? 'bg-[#C94A4A] shadow-[0_0_8px_rgba(201,74,74,0.7)] animate-pulse'
                  : 'bg-[#C4C4C4]'
              }`}
            />
            <span className="text-xs font-semibold text-[#1A1D20]">Buzzer</span>
          </div>
          <span
            className={`text-xs font-extrabold uppercase tracking-wider ${
              (buzzer.active && isOnline) || activeFeedback === 'buzzer'
                ? 'text-[#C94A4A]'
                : 'text-aeris-textSecondary'
            }`}
          >
            {(buzzer.active && isOnline) || activeFeedback === 'buzzer' ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  );
};
