import React, { useState } from 'react';
import { Home, Activity, History, Settings, Menu, X, Leaf, Volume2, VolumeX } from 'lucide-react';

interface AerisMobileNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettings: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const AerisMobileTopBar: React.FC<{
  currentTab: string;
  onTabChange: (tab: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}> = ({ currentTab, onTabChange, isMuted, onToggleMute }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelect = (tab: string) => {
    onTabChange(tab);
    setDrawerOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 bg-aeris-bg border-b border-aeris-border lg:hidden sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-[#ECE8E1] text-[#17191C]">
            <Leaf className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-bold text-base tracking-wider text-[#17191C]">
            AERIS
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg text-aeris-textSecondary hover:bg-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-1.5 rounded-lg text-aeris-textPrimary hover:bg-white transition-colors"
          >
            {drawerOpen ? <X className="w-5 h-5 stroke-[2]" /> : <Menu className="w-5 h-5 stroke-[2]" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down / Drawer Menu */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-black/30 backdrop-blur-xs">
          <div className="bg-[#F7F5F2] border-b border-aeris-border p-6 shadow-xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aeris-textSecondary uppercase tracking-wider">
                Navigation Menu
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-aeris-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home },
                { id: 'live', label: 'Live Data', icon: Activity },
                { id: 'history', label: 'History & Logs', icon: History },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                      isActive
                        ? 'bg-[#ECE8E1] text-[#17191C]'
                        : 'text-aeris-textSecondary hover:bg-white/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex-1" onClick={() => setDrawerOpen(false)} />
        </div>
      )}
    </>
  );
};

export const AerisMobileBottomBar: React.FC<AerisMobileNavProps> = ({
  currentTab,
  onTabChange,
  onOpenSettings,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-aeris-border py-2 px-6 flex items-center justify-around lg:hidden select-none">
      <button
        onClick={() => onTabChange('dashboard')}
        className={`flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer ${
          currentTab === 'dashboard'
            ? 'text-[#17191C] font-bold'
            : 'text-aeris-textMuted hover:text-aeris-textPrimary'
        }`}
      >
        <Home className="w-4 h-4 stroke-[2]" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => onTabChange('history')}
        className={`flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer ${
          currentTab === 'history'
            ? 'text-[#17191C] font-bold'
            : 'text-aeris-textMuted hover:text-aeris-textPrimary'
        }`}
      >
        <History className="w-4 h-4 stroke-[2]" />
        <span className="text-[10px]">History</span>
      </button>

      <button
        onClick={() => {
          onTabChange('settings');
          onOpenSettings();
        }}
        className={`flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer ${
          currentTab === 'settings'
            ? 'text-[#17191C] font-bold'
            : 'text-aeris-textMuted hover:text-aeris-textPrimary'
        }`}
      >
        <Settings className="w-4 h-4 stroke-[2]" />
        <span className="text-[10px]">Settings</span>
      </button>
    </div>
  );
};
