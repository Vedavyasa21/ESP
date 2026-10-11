import React, { useState } from 'react';
import { InferredHardwareState } from '../types';

interface AerisActuatorsProps {
  hardwareState: InferredHardwareState;
  isOnline: boolean;
  onTestBuzzer?: () => void;
  onTestRedLed?: () => void;
  onTestGreenLed?: () => void;
}

export const AerisActuators: React.FC<AerisActuatorsProps> = ({
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
    <div className="grid grid-cols-3 gap-4 lg:gap-6 w-full">
      {/* 1. Green LED Card */}
      <button
        onClick={handleGreenClick}
        title="Click to test Green Safe LED"
        className="bg-white rounded-2xl lg:rounded-3xl border border-aeris-border p-5 lg:p-6 shadow-card flex items-center space-x-4 text-left hover:border-[#588E75]/40 hover:shadow-md transition-all cursor-pointer group"
      >
        <div
          className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full shrink-0 transition-all ${
            (greenLed.active && isOnline) || activeFeedback === 'green'
              ? 'bg-[#588E75] shadow-[0_0_10px_rgba(88,142,117,0.7)] scale-110'
              : 'bg-[#C4C4C4]'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs lg:text-sm text-aeris-textSecondary font-semibold leading-none">
            Green LED
          </div>
          <div className="text-base lg:text-xl font-extrabold text-[#17191C] mt-1.5 leading-none">
            {(isOnline && greenLed.active) || activeFeedback === 'green' ? 'ON' : 'OFF'}
          </div>
        </div>
      </button>

      {/* 2. Red LED Card */}
      <button
        onClick={handleRedClick}
        title="Click to test Red Alarm LED"
        className="bg-white rounded-2xl lg:rounded-3xl border border-aeris-border p-5 lg:p-6 shadow-card flex items-center space-x-4 text-left hover:border-[#D14343]/40 hover:shadow-md transition-all cursor-pointer group"
      >
        <div
          className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full shrink-0 transition-all ${
            (redLed.active && isOnline) || activeFeedback === 'red'
              ? 'bg-[#D14343] shadow-[0_0_10px_rgba(209,67,67,0.7)] animate-pulse scale-110'
              : 'bg-[#C4C4C4]'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs lg:text-sm text-aeris-textSecondary font-semibold leading-none">
            Red LED
          </div>
          <div className="text-base lg:text-xl font-extrabold text-[#17191C] mt-1.5 leading-none">
            {(isOnline && redLed.active) || activeFeedback === 'red' ? 'ON' : 'OFF'}
          </div>
        </div>
      </button>

      {/* 3. Buzzer Card */}
      <button
        onClick={handleBuzzerClick}
        title="Click to test Active Buzzer Audio Tone"
        className="bg-white rounded-2xl lg:rounded-3xl border border-aeris-border p-5 lg:p-6 shadow-card flex items-center space-x-4 text-left hover:border-[#D14343]/40 hover:shadow-md transition-all cursor-pointer group"
      >
        <div
          className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full shrink-0 transition-all ${
            (buzzer.active && isOnline) || activeFeedback === 'buzzer'
              ? 'bg-[#D14343] shadow-[0_0_10px_rgba(209,67,67,0.7)] animate-pulse scale-110'
              : 'bg-[#C4C4C4]'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs lg:text-sm text-aeris-textSecondary font-semibold leading-none">
            Buzzer
          </div>
          <div className="text-base lg:text-xl font-extrabold text-[#17191C] mt-1.5 leading-none">
            {(isOnline && buzzer.active) || activeFeedback === 'buzzer' ? 'ON' : 'OFF'}
          </div>
        </div>
      </button>
    </div>
  );
};
