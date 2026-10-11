import React, { useState } from 'react';
import { ChevronDown, Cpu, Radio, Hash } from 'lucide-react';
import { DEVICE_HARDWARE_INFO } from '../constants';
import { ConnectionStatus } from '../types';

interface DeviceInfoCardProps {
  threshold: number;
  connectionStatus: ConnectionStatus;
  lastUpdatedAt: Date | null;
  endpoint: string;
}

export const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({
  threshold,
  connectionStatus,
  lastUpdatedAt,
  endpoint,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-white border border-aeris-border rounded-lg overflow-hidden transition-all">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-aeris-surface/50 transition-colors"
      >
        <div className="flex items-center space-x-2.5">
          <Cpu className="w-4 h-4 text-aeris-secondary" />
          <div>
            <h3 className="text-xs font-semibold text-aeris-primary tracking-wide">
              Hardware Specifications & Pinout
            </h3>
            <p className="text-[10px] font-mono text-aeris-secondary">
              ESP32 DevKit · MQ-2 Gas Module
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-aeris-secondary">
            {isOpen ? 'Collapse' : 'Details'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-aeris-secondary transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Collapsible Body */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-aeris-border/60 bg-aeris-surface/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono mt-3">
            {/* Device */}
            <div className="p-3 bg-white rounded border border-aeris-border">
              <span className="text-[10px] text-aeris-secondary uppercase block mb-1">
                Microcontroller
              </span>
              <span className="text-aeris-primary font-medium">
                {DEVICE_HARDWARE_INFO.device}
              </span>
            </div>

            {/* Sensor */}
            <div className="p-3 bg-white rounded border border-aeris-border">
              <span className="text-[10px] text-aeris-secondary uppercase block mb-1">
                Gas Sensor Module
              </span>
              <span className="text-aeris-primary font-medium">
                {DEVICE_HARDWARE_INFO.sensor}
              </span>
            </div>

            {/* ADC Input */}
            <div className="p-3 bg-white rounded border border-aeris-border">
              <span className="text-[10px] text-aeris-secondary uppercase block mb-1">
                Analog ADC Input
              </span>
              <span className="text-aeris-primary font-medium">
                {DEVICE_HARDWARE_INFO.adcPin}
              </span>
            </div>

            {/* Threshold */}
            <div className="p-3 bg-white rounded border border-aeris-border">
              <span className="text-[10px] text-aeris-secondary uppercase block mb-1">
                Threshold Trip Level
              </span>
              <span className="text-aeris-primary font-medium">
                {threshold} ADC counts
              </span>
            </div>

            {/* Green LED */}
            <div className="p-3 bg-white rounded border border-aeris-border">
              <span className="text-[10px] text-aeris-secondary uppercase block mb-1">
                Green LED (Safe)
              </span>
              <span className="text-aeris-primary font-medium">
                {DEVICE_HARDWARE_INFO.greenLedPin}
              </span>
            </div>

            {/* Red LED */}
            <div className="p-3 bg-white rounded border border-aeris-border">
              <span className="text-[10px] text-aeris-secondary uppercase block mb-1">
                Red LED (Alarm)
              </span>
              <span className="text-aeris-primary font-medium">
                {DEVICE_HARDWARE_INFO.redLedPin}
              </span>
            </div>

            {/* Buzzer */}
            <div className="p-3 bg-white rounded border border-aeris-border">
              <span className="text-[10px] text-aeris-secondary uppercase block mb-1">
                Piezo Buzzer
              </span>
              <span className="text-aeris-primary font-medium">
                {DEVICE_HARDWARE_INFO.buzzerPin}
              </span>
            </div>

            {/* Access Point SSID & IP */}
            <div className="p-3 bg-white rounded border border-aeris-border">
              <span className="text-[10px] text-aeris-secondary uppercase block mb-1">
                Wi-Fi Network / Endpoint
              </span>
              <span className="text-aeris-primary font-medium break-all">
                {DEVICE_HARDWARE_INFO.ssid} ({endpoint})
              </span>
            </div>
          </div>

          {/* Connection Status and Last Update Details */}
          <div className="mt-3 p-3 bg-white rounded border border-aeris-border flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-aeris-secondary gap-1.5">
            <div className="flex items-center space-x-2">
              <Radio className="w-3.5 h-3.5 text-aeris-secondary" />
              <span>
                Status:{' '}
                <strong className="text-aeris-primary uppercase">
                  {connectionStatus}
                </strong>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Hash className="w-3.5 h-3.5 text-aeris-secondary" />
              <span>
                Last Update:{' '}
                <strong className="text-aeris-primary">
                  {lastUpdatedAt ? lastUpdatedAt.toISOString() : 'None'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
