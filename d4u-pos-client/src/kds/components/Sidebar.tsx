import React from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  ChefHat, 
  Package, 
  Settings, 
  Radio, 
  XOctagon, 
  AlertOctagon,
  FlameKindling,
  LogOut
} from 'lucide-react';
import type { Tab, StationSettings } from '../types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  settings: StationSettings;
  isEmergencyStop: boolean;
  toggleEmergencyStop: () => void;
  activeOrdersCount: number;
  onLogout?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  settings,
  isEmergencyStop,
  toggleEmergencyStop,
  activeOrdersCount,
  onLogout
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders' as Tab, label: 'Orders', icon: ReceiptText },
    { id: 'kitchen' as Tab, label: 'Kitchen', icon: ChefHat, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined },
    { id: 'inventory' as Tab, label: 'Inventory', icon: Package },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-[280px] bg-[#070e1d] border-r border-[#4f4633]/40 flex flex-col h-full shrink-0 select-none">
      <div className="p-6 flex flex-col gap-6">
        {/* Chef Avatar and Station ID */}
        <div className="flex items-center justify-between p-1 rounded-xl bg-[#141b2b]/50 border border-[#2e3545]/40 pr-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-yellow shrink-0 bg-cover bg-center" 
              style={{ 
                backgroundImage: `url("${settings.chefAvatar}")` 
              }}
            />
            <div className="flex flex-col min-w-0">
              <h2 className="text-[#dce2f7] font-display font-bold text-base leading-tight truncate">
                {settings.stationName}
              </h2>
              <p className="text-[#d3c5ac] text-xs font-mono mt-0.5 truncate">
                {settings.specialtyName}
              </p>
            </div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-9 h-9 rounded-lg bg-[#410006] border border-[#ff3333]/30 hover:bg-[#690005] flex items-center justify-center text-[#ffdad6] shrink-0 transition-all cursor-pointer shadow-sm hover:shadow-[#93000a]/20"
              title="Logout from Station"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {/* Navigation Elements */}
        <nav className="flex flex-col gap-1.5" id="sidebar-navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                  isActive 
                    ? 'bg-brand-yellow text-[#261a00] font-bold shadow-lg shadow-brand-yellow/15 translate-x-1' 
                    : 'text-[#dce2f7]/80 hover:text-[#dce2f7] hover:bg-[#191f2f] hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon 
                    className={`w-5 h-5 ${isActive ? 'text-[#261a00]' : 'text-[#d3c5ac]'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="font-sans text-sm tracking-wide">{item.label}</span>
                </div>
                {item.badge !== undefined && !isActive && (
                  <span className="bg-brand-red text-white text-xxs font-mono font-bold px-2 py-0.5 rounded-full ring-2 ring-[#070e1d] animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status and Emergency Stop */}
      <div className="mt-auto p-5 border-t border-[#4f4633]/30 bg-[#141b2b]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#d3c5ac] uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-brand-green animate-pulse" />
            <span>KDS Service</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isEmergencyStop ? 'bg-brand-red animate-ping' : 'bg-brand-green shadow-sm shadow-brand-green/35'}`} />
            <span className={`text-xs font-mono font-bold ${isEmergencyStop ? 'text-brand-red' : 'text-brand-green'}`}>
              {isEmergencyStop ? 'OFFLINE' : 'ONLINE'}
            </span>
          </div>
        </div>

        {isEmergencyStop ? (
          <button 
            id="emergency-clear-btn"
            onClick={toggleEmergencyStop}
            className="w-full flex items-center justify-center gap-2 bg-brand-green text-[#002113] py-3 rounded-xl font-bold font-display text-sm tracking-widest uppercase hover:brightness-110 active:scale-98 transition-all cursor-pointer animate-heartbeat"
          >
            <FlameKindling className="w-4 h-4" />
            <span>RESUME ALL</span>
          </button>
        ) : (
          <button 
            id="emergency-stop-btn"
            onClick={toggleEmergencyStop}
            className="w-full flex items-center justify-center gap-2 bg-brand-darkred text-[#ffdad6] py-3 rounded-xl font-bold font-display text-sm tracking-widest uppercase hover:bg-red-800 active:scale-98 transition-all cursor-pointer"
          >
            <XOctagon className="w-4 h-4 text-brand-red" />
            <span>EMERGENCY STOP</span>
          </button>
        )}
      </div>
    </aside>
  );
}
