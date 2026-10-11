import React, { useState } from 'react';
import { History, ChevronDown, Flame, ShieldCheck } from 'lucide-react';
import { AlarmEvent } from '../types';

interface AlarmEventsDrawerProps {
  events: AlarmEvent[];
}

export const AlarmEventsDrawer: React.FC<AlarmEventsDrawerProps> = ({ events }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-white border border-aeris-border rounded-lg overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-aeris-surface/50 transition-colors"
      >
        <div className="flex items-center space-x-2.5">
          <History className="w-4 h-4 text-aeris-secondary" />
          <div>
            <h3 className="text-xs font-semibold text-aeris-primary tracking-wide">
              Alarm Event Log & Transitions
            </h3>
            <p className="text-[10px] font-mono text-aeris-secondary">
              {events.length} recorded transition{events.length === 1 ? '' : 's'} · Deduplicated
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-aeris-secondary">
            {isOpen ? 'Collapse' : 'View'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-aeris-secondary transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-aeris-border/60 bg-aeris-surface/30">
          {events.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono text-aeris-secondary">
              No threshold-crossing events recorded in this session.
            </div>
          ) : (
            <div className="divide-y divide-aeris-border/60 mt-2">
              {events.map((evt) => {
                const isCrossed = evt.type === 'GAS_THRESHOLD_CROSSED';
                const formattedTime = new Date(evt.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <div key={evt.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`p-1 rounded ${
                          isCrossed ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {isCrossed ? (
                          <Flame className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-aeris-primary">
                          {isCrossed ? 'GAS THRESHOLD CROSSED' : 'ALARM CLEARED'}
                        </span>
                        <div className="text-[10px] text-aeris-secondary">
                          {isCrossed
                            ? `Trip Reading: ${evt.adc} ADC (Limit: ${evt.threshold})`
                            : `Sensor normalized below threshold`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-aeris-secondary font-medium">
                        {formattedTime}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
