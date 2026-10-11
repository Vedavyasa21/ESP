import React from 'react';
import { Leaf, ShieldCheck, Activity, Flame, AlertTriangle } from 'lucide-react';

interface AerisHeroBannerProps {
  isAlarm: boolean;
  lastUpdatedText?: string;
}

export const AerisHeroBanner: React.FC<AerisHeroBannerProps> = ({
  isAlarm,
  lastUpdatedText = '2 seconds ago',
}) => {
  return (
    <div className="relative w-full bg-white rounded-3xl border border-aeris-border overflow-hidden shadow-card flex flex-col lg:flex-row items-center justify-between min-h-[300px] select-none transition-all">
      {/* Background Subtle Gradient & Botanical Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-[#EFECE4]/60 pointer-events-none" />

      {/* Left Content Column */}
      <div className="relative z-10 p-8 sm:p-10 lg:p-12 flex-1 max-w-2xl flex flex-col justify-between">
        <div>
          {/* Subtitle Tracking Label */}
          <span className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-aeris-textSecondary">
            Live Monitoring
          </span>

          {/* Large Editorial Serif Heading */}
          <h1
            className={`font-serif text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight mt-3 leading-tight transition-colors duration-300 ${
              isAlarm ? 'text-[#C94A4A]' : 'text-[#1A1D20]'
            }`}
          >
            {isAlarm ? 'Gas Leakage Detected!' : 'Good Air'}
          </h1>

          {/* Descriptive Subtitle */}
          <p className="text-sm sm:text-base text-aeris-textSecondary mt-2.5 font-normal leading-relaxed max-w-lg">
            {isAlarm
              ? 'Gas level has exceeded the configured threshold. Immediate inspection required.'
              : 'No gas leakage detected. Everything is normal.'}
          </p>
        </div>

        {/* 3 Metric Indicators Row */}
        <div className="mt-8 pt-2 flex flex-wrap items-center gap-6 sm:gap-8">
          {/* 1. Gas Level */}
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl transition-colors ${
                isAlarm ? 'bg-red-50 text-[#C94A4A]' : 'bg-[#EDF4F0] text-[#4E8168]'
              }`}
            >
              {isAlarm ? (
                <Flame className="w-5 h-5 stroke-[1.8]" />
              ) : (
                <Leaf className="w-5 h-5 stroke-[1.8]" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-medium text-aeris-textSecondary leading-none">
                Gas Level
              </div>
              <div
                className={`text-sm sm:text-base font-bold mt-1 leading-none ${
                  isAlarm ? 'text-[#C94A4A]' : 'text-[#4E8168]'
                }`}
              >
                {isAlarm ? 'High' : 'Normal'}
              </div>
            </div>
          </div>

          {/* 2. Air Quality */}
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl transition-colors ${
                isAlarm ? 'bg-red-50 text-[#C94A4A]' : 'bg-[#EDF4F0] text-[#4E8168]'
              }`}
            >
              {isAlarm ? (
                <AlertTriangle className="w-5 h-5 stroke-[1.8]" />
              ) : (
                <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-medium text-aeris-textSecondary leading-none">
                Air Quality
              </div>
              <div
                className={`text-sm sm:text-base font-bold mt-1 leading-none ${
                  isAlarm ? 'text-[#C94A4A]' : 'text-[#4E8168]'
                }`}
              >
                {isAlarm ? 'Unsafe' : 'Safe'}
              </div>
            </div>
          </div>

          {/* 3. System */}
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl transition-colors ${
                isAlarm ? 'bg-amber-50 text-amber-600' : 'bg-[#EDF4F0] text-[#4E8168]'
              }`}
            >
              <Activity className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-aeris-textSecondary leading-none">
                System
              </div>
              <div
                className={`text-sm sm:text-base font-bold mt-1 leading-none ${
                  isAlarm ? 'text-amber-600' : 'text-[#4E8168]'
                }`}
              >
                {isAlarm ? 'Warning' : 'Stable'}
              </div>
            </div>
          </div>
        </div>

        {/* Timestamp Footer */}
        <div className="mt-6 flex items-center space-x-2 text-xs text-aeris-textSecondary">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A85968]" />
          <span>Last updated: {lastUpdatedText}</span>
        </div>
      </div>

      {/* Right Visual: Botanical Leaves + Angled ESP32 DevKit Board Render */}
      <div className="relative w-full lg:w-[420px] h-[260px] lg:h-[320px] flex items-center justify-center overflow-hidden shrink-0 pr-4 lg:pr-8">
        {/* Rich Botanical Eucalyptus Sprig Background */}
        <div className="absolute -top-12 -right-8 w-96 h-96 pointer-events-none opacity-90 select-none">
          <svg viewBox="0 0 320 320" className="w-full h-full">
            <defs>
              <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A755D" />
                <stop offset="50%" stopColor="#375D49" />
                <stop offset="100%" stopColor="#254233" />
              </linearGradient>
              <linearGradient id="leafGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5D8B70" />
                <stop offset="60%" stopColor="#456E56" />
                <stop offset="100%" stopColor="#2C4837" />
              </linearGradient>
              <linearGradient id="leafGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#759E83" />
                <stop offset="100%" stopColor="#3C644E" />
              </linearGradient>
              <filter id="leafShadow" x="-20%" y="-20%" width="150%" height="150%">
                <feDropShadow dx="3" dy="8" stdDeviation="6" floodColor="#1B2E22" floodOpacity="0.16" />
              </filter>
            </defs>

            {/* Main Eucalyptus Stem */}
            <path
              d="M 280,0 Q 220,110 130,220"
              fill="none"
              stroke="#5A5243"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Leaf 1 - Large Upper Right */}
            <g filter="url(#leafShadow)">
              <path
                d="M 270,30 C 230,10 170,40 180,95 C 190,140 240,110 270,30 Z"
                fill="url(#leafGrad1)"
              />
              <path
                d="M 270,30 Q 215,70 180,95"
                fill="none"
                stroke="#6B967D"
                strokeWidth="1"
                opacity="0.6"
              />
            </g>

            {/* Leaf 2 - Graceful Broad Leaf Mid-Right */}
            <g filter="url(#leafShadow)">
              <path
                d="M 235,100 C 180,70 120,110 145,170 C 165,210 220,165 235,100 Z"
                fill="url(#leafGrad2)"
              />
              <path
                d="M 235,100 Q 170,140 145,170"
                fill="none"
                stroke="#7AA68C"
                strokeWidth="1.2"
                opacity="0.6"
              />
            </g>

            {/* Leaf 3 - Upper Soft Leaf */}
            <g filter="url(#leafShadow)">
              <path
                d="M 290,15 C 270,70 230,85 220,70 C 210,50 250,10 290,15 Z"
                fill="url(#leafGrad3)"
                opacity="0.85"
              />
            </g>

            {/* Leaf 4 - Lower Leaf Arching Over Board */}
            <g filter="url(#leafShadow)">
              <path
                d="M 165,185 C 120,170 70,220 100,265 C 130,290 170,230 165,185 Z"
                fill="url(#leafGrad1)"
              />
              <path
                d="M 165,185 Q 120,225 100,265"
                fill="none"
                stroke="#658F76"
                strokeWidth="1"
                opacity="0.6"
              />
            </g>

            {/* Leaf 5 - Small Sprout Leaf */}
            <path
              d="M 140,210 C 110,215 80,240 100,260 C 120,270 145,235 140,210 Z"
              fill="url(#leafGrad2)"
              opacity="0.75"
            />
          </svg>
        </div>

        {/* Realistic Angled ESP32 Board Illustration */}
        <div className="relative transform rotate-[-12deg] hover:rotate-[-8deg] transition-transform duration-700 hover:scale-105 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.18)]">
          <svg
            width="280"
            height="180"
            viewBox="0 0 280 180"
            className="w-[260px] sm:w-[290px]"
          >
            <defs>
              <linearGradient id="pcbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#242628" />
                <stop offset="50%" stopColor="#18191B" />
                <stop offset="100%" stopColor="#0F1011" />
              </linearGradient>
              <linearGradient id="metalShield" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2E4E6" />
                <stop offset="40%" stopColor="#B4B8BC" />
                <stop offset="100%" stopColor="#8A8E94" />
              </linearGradient>
              <linearGradient id="goldPin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE082" />
                <stop offset="100%" stopColor="#FFB300" />
              </linearGradient>
            </defs>

            {/* Board Base PCB */}
            <rect x="25" y="20" width="230" height="135" rx="8" fill="url(#pcbGrad)" stroke="#3A3D42" strokeWidth="1.5" />

            {/* Mounting Holes */}
            <circle cx="36" cy="30" r="4.5" fill="#3D3F44" stroke="#FFD54F" strokeWidth="1" />
            <circle cx="244" cy="30" r="4.5" fill="#3D3F44" stroke="#FFD54F" strokeWidth="1" />
            <circle cx="36" cy="145" r="4.5" fill="#3D3F44" stroke="#FFD54F" strokeWidth="1" />
            <circle cx="244" cy="145" r="4.5" fill="#3D3F44" stroke="#FFD54F" strokeWidth="1" />

            {/* Top & Bottom Header Pins (Gold contacts) */}
            {Array.from({ length: 15 }).map((_, i) => (
              <g key={`pins-${i}`}>
                {/* Top pin */}
                <rect x={48 + i * 12.5} y="22" width="6" height="10" rx="1.5" fill="url(#goldPin)" />
                <circle cx={51 + i * 12.5} cy="27" r="1.5" fill="#111" />
                {/* Bottom pin */}
                <rect x={48 + i * 12.5} y="143" width="6" height="10" rx="1.5" fill="url(#goldPin)" />
                <circle cx={51 + i * 12.5} cy="148" r="1.5" fill="#111" />
              </g>
            ))}

            {/* ESP-WROOM-32 Metal RF Shield */}
            <rect x="135" y="42" width="95" height="90" rx="4" fill="url(#metalShield)" stroke="#D0D4D8" strokeWidth="1" />
            {/* Espressif Laser Etching */}
            <text x="182" y="65" fontSize="8" fontWeight="bold" fill="#333" textAnchor="middle" letterSpacing="1">
              ESPRESSIF
            </text>
            <text x="182" y="80" fontSize="10" fontWeight="extrabold" fill="#222" textAnchor="middle" letterSpacing="0.5">
              ESP-WROOM-32
            </text>
            <text x="182" y="94" fontSize="7" fill="#444" textAnchor="middle">
              FCC ID: 2AC7Z-ESPWROOM32
            </text>
            <rect x="155" y="105" width="55" height="18" rx="2" fill="#999EAA" opacity="0.4" />
            {/* 2.4GHz Antenna Traces */}
            <rect x="230" y="44" width="20" height="86" rx="2" fill="#8D2B1B" />
            <path d="M232 50 h12 v6 h-12 v6 h12 v6 h-12 v6 h12 v6 h-12 v6 h12 v6 h-12 v6 h12 v6 h-12 v6 h12" fill="none" stroke="#FFD54F" strokeWidth="1.5" />

            {/* Micro-USB / Type-C Connector on Left */}
            <rect x="15" y="70" width="20" height="35" rx="3" fill="#D5D9DC" stroke="#888" strokeWidth="1" />
            <rect x="15" y="76" width="6" height="23" rx="1" fill="#222" />

            {/* CP2102 / CH340 USB-UART Chip */}
            <rect x="60" y="75" width="24" height="25" rx="2" fill="#111" stroke="#444" strokeWidth="0.8" />
            <circle cx="65" cy="80" r="1" fill="#888" />
            <text x="72" y="90" fontSize="5" fill="#888" textAnchor="middle">CP2102</text>

            {/* Reset / Boot Tactile Buttons */}
            <rect x="42" y="42" width="12" height="14" rx="2" fill="#DDD" />
            <circle cx="48" cy="49" r="3" fill="#333" />
            <text x="48" y="62" fontSize="5" fill="#888" textAnchor="middle">EN</text>

            <rect x="42" y="119" width="12" height="14" rx="2" fill="#DDD" />
            <circle cx="48" cy="126" r="3" fill="#333" />
            <text x="48" y="139" fontSize="5" fill="#888" textAnchor="middle">BOOT</text>

            {/* Status LEDs */}
            {/* Power LED (Red) */}
            <circle cx="75" cy="50" r="2.5" fill="#E53935" filter="drop-shadow(0 0 4px #E53935)" />
            {/* GPIO 2 / IO LED (Blue) */}
            <circle cx="75" cy="125" r="2.5" fill={isAlarm ? '#E53935' : '#4E8168'} filter={`drop-shadow(0 0 5px ${isAlarm ? '#E53935' : '#4E8168'})`} />
          </svg>
        </div>
      </div>
    </div>
  );
};
