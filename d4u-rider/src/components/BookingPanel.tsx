import React from 'react';
import { DeliveryOrder, RiderStats } from '../types';
import { SF_LANDMARKS, DISPATCHABLE_MOCK_ORDERS } from '../data';
import { 
  Compass, Flame, Shield, Star, DollarSign, 
  Map, Zap, ArrowRight, CheckCircle2, Play 
} from 'lucide-react';

interface BookingPanelProps {
  riderStats: RiderStats;
  isOnline: boolean;
  onToggleOnline: () => void;
  activeOrder: DeliveryOrder | null;
  onAcceptMission: (order: DeliveryOrder) => void;
}

export default function BookingPanel({
  riderStats,
  isOnline,
  onToggleOnline,
  activeOrder,
  onAcceptMission
}: BookingPanelProps) {
  
  const xpPercent = Math.min(100, Math.round((riderStats.xp / riderStats.nextLevelXp) * 100));

  return (
    <div className="flex flex-col gap-5 text-slate-200">
      
      {/* 1. DUTY STATUS & GENERAL EARNINGS COMPARTMENT */}
      <div className="bg-[#141b2b] p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full text-amber-500 font-bold inline-block">
              Courier Hub
            </p>
            <h2 className="text-xl font-display font-black text-slate-100 tracking-tight mt-1.5">
              Rider Console
            </h2>
          </div>

          {/* Quick duty switch */}
          <button
            onClick={onToggleOnline}
            className={`px-4 py-2 rounded-full text-xs font-display font-black uppercase tracking-wider transition-all cursor-pointer 
              ${isOnline 
                ? 'bg-emerald-500 text-[#002113] border-2 border-emerald-300 ring-4 ring-emerald-505/10 animate-pulse' 
                : 'bg-rose-950 text-rose-400 border border-rose-900/40'
              }`}
          >
            ● {isOnline ? 'ONLINE' : 'GO ONLINE'}
          </button>
        </div>

        {/* Real-time statistics matching screenshots exactly */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#070e1d] p-3.5 rounded-xl border border-slate-800">
            <p className="text-[9px] uppercase font-mono font-bold text-slate-550">Today's Bounty</p>
            <p className="text-xl font-display font-extrabold text-[#ffe1a7] mt-1">${riderStats.todayEarnings.toFixed(2)}</p>
            <p className="text-[9px] text-[#4edea3] mt-0.5 font-bold flex items-center gap-0.5 font-mono">
              ★ Active Streak: {riderStats.streak} Days
            </p>
          </div>

          <div className="bg-[#070e1d] p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <p className="text-[9px] uppercase font-mono font-bold text-slate-550">Active Multiplier</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base font-display font-extrabold text-amber-500">1.5x Surge</span>
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
            </div>
            <p className="text-[9px] text-slate-550">Financial District zone bonus</p>
          </div>
        </div>

        {/* Level Progression meter */}
        <div className="mt-4 pt-4 border-t border-slate-850">
          <div className="flex justify-between items-center mb-1.5 text-xs text-slate-350">
            <span className="font-display font-bold">Master Courier Lvl {riderStats.level}</span>
            <span className="font-mono text-[10px] text-slate-500">{riderStats.xp} / {riderStats.nextLevelXp} XP</span>
          </div>
          <div className="w-full h-2 bg-[#070e1d] rounded-full overflow-hidden border border-slate-900">
            <div 
              className="h-full bg-gradient-to-r from-[#4edea3] to-teal-400 transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <div className="flex gap-2 mt-2 text-[8.5px] font-mono font-bold">
            <span className="bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-amber-400 px-1.5 py-0.5 rounded">2X XP ACTIVE</span>
            <span className="bg-purple-950/20 border border-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">ELITE RANK</span>
          </div>
        </div>

      </div>

      {/* 2. SCANNING RADAR AREA IF NO ORDER ASSIGNED */}
      {!activeOrder && (
        <div className="bg-[#070e1d] border border-slate-800 p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-3 relative overflow-hidden h-44">
          {isOnline ? (
            <>
              {/* Radar scanner sweep animation */}
              <div className="absolute inset-0 bg-radial-radar opacity-15 pointer-events-none" />
              <div className="w-12 h-12 rounded-full border border-emerald-500/20 flex items-center justify-center animate-ping absolute" />
              <div className="w-10 h-10 rounded-full bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-center relative">
                <Compass className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Scanning For POS Dispatches</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[280px]">
                  Rider is online. Simulated orders made at the top "POS Control Panel" will push instantly onto this screen.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-rose-950/30 border border-rose-900/40 flex items-center justify-center text-rose-400 text-lg">
                💤
              </div>
              <div>
                <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">You Are Offline</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Toggle the status switch above to "Online" to accept incoming customer dishes and POS deliveries.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. ACTIVE MISSIONS (SCREEN 2 COMPONENT LISTINGS) */}
      <div className="bg-[#141b2b] p-5 rounded-2xl border border-slate-800">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5">
          🎯 Available Online Orders Queue
        </h3>
        <p className="text-[11px] text-slate-400 leading-normal mb-3">
          Accept standard online customer deliveries manually. Accepting any of these will instantly dispatch it to your smartphone.
        </p>

        <div className="flex flex-col gap-3">
          {DISPATCHABLE_MOCK_ORDERS.filter(o => o.source === 'ONLINE_ORDER').map((mission) => (
            <div 
              key={`mission-opt-${mission.id}`}
              className="bg-[#070e1d] p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[8px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-900/30 px-1.5 py-0.2 rounded uppercase">
                    Hot Order Bonus XP
                  </span>
                  <h4 className="font-display font-bold text-slate-200 text-xs mt-1 leading-snug">
                    {mission.restaurantName.split(' - ')[0]}
                  </h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Dropoff: {mission.customerName}</p>
                </div>

                <div className="text-right">
                  <p className="font-mono text-emerald-400 font-extrabold text-xs">+${mission.earnings.toFixed(2)}</p>
                  <p className="text-[9px] text-slate-450 font-mono mt-0.5">{mission.distance} miles away</p>
                </div>
              </div>

              {/* Items summary */}
              <div className="mt-2.5 pt-2 border-t border-slate-900 text-[10px] text-slate-500 flex justify-between items-center">
                <span>📦 {mission.itemsCount} Delicious dishes</span>
                <span>⏱️ {mission.estTimeMins} mins est</span>
              </div>

              {/* Action Accept button */}
              <button
                onClick={() => onAcceptMission(mission)}
                disabled={!isOnline || !!activeOrder}
                className="w-full mt-3 py-1.5 bg-[#ffe1a7] hover:bg-[#ffe1a7]/90 text-[#402d00] font-sans font-extrabold rounded-lg text-[10.5px] uppercase tracking-wide transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                Accept Mission <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
