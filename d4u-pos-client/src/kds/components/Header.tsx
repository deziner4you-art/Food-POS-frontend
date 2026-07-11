import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, ShieldAlert, Sparkles } from 'lucide-react';

interface HeaderProps {
  pendingCount: number;
  readyCount: number;
  onRefresh: () => void;
  onSimulateNewOrder: () => void;
  isEmergencyStop: boolean;
}

export default function Header({
  pendingCount,
  readyCount,
  onRefresh,
  onSimulateNewOrder,
  isEmergencyStop
}: HeaderProps) {
  const [localTime, setLocalTime] = useState<string>('00:00:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
      setLocalTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-[#4f4633]/30 bg-[#191f2f] shadow-md z-10 shrink-0">
      <div className="flex items-center gap-6">
        <h1 className="font-display font-bold text-2xl text-[#dce2f7] select-none flex items-center gap-2">
          <span>Kitchen Display System</span>
          {isEmergencyStop && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-red/10 border border-brand-red/30 rounded-full text-xs font-mono font-bold text-brand-red animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              EMERGENCY LOCKDOWN
            </span>
          )}
        </h1>
        
        {/* Status Badges */}
        <div className="flex gap-3 select-none">
          <div className="flex items-center bg-[#2e3545] px-4 py-1.5 rounded-full border border-[#4f4633]/30">
            <span className="text-xs font-mono font-bold text-brand-yellow mr-2">PENDING:</span>
            <span className="text-base font-display font-bold leading-none tabular-nums text-[#dce2f7]">
              {pendingCount}
            </span>
          </div>
          <div className="flex items-center bg-[#2e3545] px-4 py-1.5 rounded-full border border-[#4f4633]/30">
            <span className="text-xs font-mono font-bold text-brand-green mr-2">READY:</span>
            <span className="text-base font-display font-bold leading-none tabular-nums text-[#dce2f7]">
              {readyCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Action controls for previewing & testing */}
        <div className="flex gap-2">
          <button
            id="simulation-trigger"
            onClick={onSimulateNewOrder}
            disabled={isEmergencyStop}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#2a2618]/60 hover:bg-[#3d3722] disabled:opacity-40 border border-brand-yellow/30 hover:border-brand-yellow/50 rounded-lg text-xs font-mono font-bold text-brand-yellow transition-all cursor-pointer"
            title="Create and simulate a brand new client sandwich ticket immediately"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-yellow" />
            <span>PUSH TEST ORDER</span>
          </button>
        </div>

        {/* Local time */}
        <div className="flex flex-col items-end mr-2 select-none">
          <span className="text-[10px] uppercase tracking-widest text-[#d3c5ac] font-bold font-mono">Local Time</span>
          <span className="text-xl font-mono font-bold leading-tight tabular-nums text-brand-yellow">
            {localTime}
          </span>
        </div>

        {/* Reset button */}
        <button
          onClick={onRefresh}
          className="w-10 h-10 rounded-xl bg-[#2e3545] border border-[#4f4633]/30 flex items-center justify-center hover:bg-[#323949] transition-all cursor-pointer transform hover:rotate-45"
          title="Reset sample orders and simulation data"
        >
          <RefreshCw className="w-4 h-4 text-[#dce2f7]" />
        </button>
      </div>
    </header>
  );
}
