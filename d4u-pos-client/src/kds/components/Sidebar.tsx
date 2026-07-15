import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  ChefHat, 
  Package, 
  Settings, 
  Radio, 
  XOctagon, 
  FlameKindling,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock
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
  isAdminUnlocked?: boolean;
  onAdminLogin?: () => void;
  onAdminLogout?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  settings,
  isEmergencyStop,
  toggleEmergencyStop,
  activeOrdersCount,
  onLogout,
  isAdminUnlocked,
  onAdminLogin,
  onAdminLogout
}: SidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const navItems = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders' as Tab, label: 'Orders', icon: ReceiptText },
    { id: 'kitchen' as Tab, label: 'Kitchen', icon: ChefHat, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined },
    { id: 'inventory' as Tab, label: 'Inventory', icon: Package },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`transition-all duration-300 relative ${isSidebarOpen ? 'w-[280px]' : 'w-[80px]'} bg-[#070e1d] border-r border-[#4f4633]/40 flex flex-col h-full shrink-0 select-none z-20`}>
      {/* Collapse/Expand Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute -right-3 top-8 bg-[#141b2b] text-[#dce2f7] border border-[#2e3545] rounded-full p-1 hover:text-white hover:bg-[#191f2f] z-30 transition-colors shadow-lg"
      >
        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <div className={`flex flex-col gap-6 ${isSidebarOpen ? 'p-6' : 'p-3 pt-6'}`}>
        {/* Chef Avatar and Station ID */}
        <div className={`flex items-center ${isSidebarOpen ? 'justify-between p-1 pr-2 rounded-xl bg-[#141b2b]/50 border border-[#2e3545]/40' : 'justify-center'} transition-all`}>
          <div className="flex items-center gap-3">
            <div 
              className={`rounded-full overflow-hidden border-2 border-brand-yellow shrink-0 bg-cover bg-center transition-all ${isSidebarOpen ? 'w-12 h-12' : 'w-10 h-10'}`} 
              style={{ 
                backgroundImage: `url("${settings.chefAvatar}")` 
              }}
              title={!isSidebarOpen ? settings.stationName : ''}
            />
            {isSidebarOpen && (
              <div className="flex flex-col min-w-0">
                <h2 className="text-[#dce2f7] font-display font-bold text-base leading-tight truncate">
                  {settings.stationName}
                </h2>
                <p className="text-[#d3c5ac] text-xs font-mono mt-0.5 truncate">
                  {settings.specialtyName}
                </p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col gap-1 ml-auto">
              {!isAdminUnlocked ? (
                <button 
                  onClick={onAdminLogin}
                  className="w-9 h-9 rounded-lg bg-[#0e1626] border border-brand-yellow/30 hover:bg-[#151f33] flex items-center justify-center text-brand-yellow shrink-0 transition-all cursor-pointer shadow-sm hover:shadow-brand-yellow/10"
                  title="Login as Manager"
                >
                  <Lock className="w-4.5 h-4.5" />
                </button>
              ) : (
                <button 
                  onClick={onAdminLogout}
                  className="w-9 h-9 rounded-lg bg-[#410006] border border-[#ff3333]/30 hover:bg-[#690005] flex items-center justify-center text-[#ffdad6] shrink-0 transition-all cursor-pointer shadow-sm hover:shadow-[#93000a]/20"
                  title="Logout Manager"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
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
                className={`relative w-full flex items-center ${isSidebarOpen ? 'justify-between px-4 py-3' : 'justify-center py-4 px-0'} rounded-xl transition-all duration-200 text-left ${
                  isActive 
                    ? 'bg-brand-yellow text-[#261a00] font-bold shadow-lg shadow-brand-yellow/15 translate-x-1' 
                    : 'text-[#dce2f7]/80 hover:text-[#dce2f7] hover:bg-[#191f2f] hover:translate-x-0.5'
                }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : ''}`}>
                  <Icon 
                    className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} ${isActive ? 'text-[#261a00]' : 'text-[#d3c5ac]'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isSidebarOpen && <span className="font-sans text-sm tracking-wide">{item.label}</span>}
                </div>
                {item.badge !== undefined && !isActive && (
                  isSidebarOpen ? (
                    <span className="bg-brand-red text-white text-xxs font-mono font-bold px-2 py-0.5 rounded-full ring-2 ring-[#070e1d] animate-pulse">
                      {item.badge}
                    </span>
                  ) : (
                    <span className="absolute top-1.5 right-1.5 bg-brand-red text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full animate-pulse border border-[#070e1d]">
                      {item.badge}
                    </span>
                  )
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status and Emergency Stop */}
      <div className={`mt-auto border-t border-[#4f4633]/30 bg-[#141b2b] ${isSidebarOpen ? 'p-5' : 'p-3 flex flex-col items-center gap-4'}`}>
        <div className={`flex items-center ${isSidebarOpen ? 'justify-between mb-4' : 'flex-col gap-3'}`}>
          {isSidebarOpen ? (
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#d3c5ac] uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-brand-green animate-pulse" />
              <span>KDS Service</span>
            </div>
          ) : (
             <Radio className="w-5 h-5 text-brand-green animate-pulse" title="KDS Service Online" />
          )}
          
          {isSidebarOpen ? (
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isEmergencyStop ? 'bg-brand-red animate-ping' : 'bg-brand-green shadow-sm shadow-brand-green/35'}`} />
              <span className={`text-xs font-mono font-bold ${isEmergencyStop ? 'text-brand-red' : 'text-brand-green'}`}>
                {isEmergencyStop ? 'OFFLINE' : 'ONLINE'}
              </span>
            </div>
          ) : (
            <span 
              className={`w-3 h-3 rounded-full ${isEmergencyStop ? 'bg-brand-red animate-ping' : 'bg-brand-green shadow-sm shadow-brand-green/35'}`} 
              title={isEmergencyStop ? 'OFFLINE' : 'ONLINE'} 
            />
          )}
        </div>

        {isEmergencyStop ? (
          <button 
            id="emergency-clear-btn"
            onClick={toggleEmergencyStop}
            className={`w-full flex items-center justify-center gap-2 bg-brand-green text-[#002113] rounded-xl font-bold font-display text-sm tracking-widest uppercase hover:brightness-110 active:scale-98 transition-all cursor-pointer animate-heartbeat ${isSidebarOpen ? 'py-3' : 'py-3 px-0'}`}
            title="RESUME ALL"
          >
            <FlameKindling className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>RESUME ALL</span>}
          </button>
        ) : (
          <button 
            id="emergency-stop-btn"
            onClick={toggleEmergencyStop}
            className={`w-full flex items-center justify-center gap-2 bg-brand-darkred text-[#ffdad6] rounded-xl font-bold font-display text-sm tracking-widest uppercase hover:bg-red-800 active:scale-98 transition-all cursor-pointer ${isSidebarOpen ? 'py-3' : 'py-3 px-0'}`}
            title="EMERGENCY STOP"
          >
            <XOctagon className="w-5 h-5 text-brand-red shrink-0" />
            {isSidebarOpen && <span>EMERGENCY STOP</span>}
          </button>
        )}

        {!isSidebarOpen && onLogout && (
          <button 
            onClick={onLogout}
            className="w-full mt-1 flex items-center justify-center py-3 rounded-xl bg-[#410006] border border-[#ff3333]/30 hover:bg-[#690005] text-[#ffdad6] transition-all cursor-pointer shadow-sm hover:shadow-[#93000a]/20"
            title="Logout from Station"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
