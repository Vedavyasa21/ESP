import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-8 pt-6 pb-12 border-t border-aeris-border text-center">
      <div className="max-w-2xl mx-auto px-4 space-y-2">
        <p className="text-xs font-mono font-medium tracking-widest text-aeris-primary uppercase">
          AERIS · Embedded Monitoring
        </p>

        <p className="text-[11px] font-mono text-aeris-secondary">
          Educational prototype. Not a certified gas safety device.
        </p>

        <div className="pt-2 flex items-center justify-center space-x-1.5 text-[10px] text-aeris-secondary/80">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>
            Below-threshold readings indicate un-tripped sensor voltage and do not certify ambient air purity. The physical ESP32 buzzer operates autonomously.
          </span>
        </div>
      </div>
    </footer>
  );
};
