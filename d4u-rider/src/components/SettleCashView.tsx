import React from 'react';
import { RiderStats } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface SettleCashViewProps {
  stats: RiderStats;
  onBack: () => void;
  onSettle: () => void;
}

export default function SettleCashView({ stats, onBack, onSettle }: SettleCashViewProps) {
  // Mock weekly summary for UI layout
  const weeklySummary = {
    earnings: stats.todayEarnings + 85.45,
    workTime: '12hr 45 min',
    rides: 23
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Top Banner Area */}
      <div className="bg-primary text-slate-900 p-4 pt-6 pb-12 rounded-b-3xl z-10 relative">
        <button onClick={onBack} className="mb-6 active:scale-95 transition-transform">
          <ArrowLeft size={24} />
        </button>
        
        <h1 className="font-display font-bold text-2xl mb-1">COD Collected</h1>
        <p className="text-primary-light text-sm mb-4">Pending Settlement</p>
        
        <div className="text-5xl font-display font-extrabold mb-6 tracking-tight">
          ${stats.todayEarnings.toFixed(2)}
        </div>
        
        <p className="text-sm text-slate-900/90 mb-6">
          Settle this amount with the Cashier at the POS to clear your daily collection ledger.
        </p>

        <button 
          onClick={onSettle}
          className="bg-slate-900 text-primary font-bold py-3 px-8 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          Settle with POS
        </button>
      </div>

      {/* Cards Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 mt-[-20px] relative z-20">
        
        {/* Today's Activity */}
        <h3 className="font-bold text-slate-100 mb-3 ml-1 text-lg">Today's Activity</h3>
        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-100 p-5 flex justify-between items-center mb-8">
          <div className="text-center flex-1 border-r border-slate-100">
            <p className="text-slate-400 text-xs font-semibold mb-1">Earning</p>
            <p className="font-bold text-slate-100 text-sm">${(stats.todayEarnings * 0.15).toFixed(2)}</p>
          </div>
          <div className="text-center flex-1 border-r border-slate-100">
            <p className="text-slate-400 text-xs font-semibold mb-1">Work time</p>
            <p className="font-bold text-slate-100 text-sm">3hr 45 min</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-slate-400 text-xs font-semibold mb-1">Rides</p>
            <p className="font-bold text-slate-100 text-sm">07</p>
          </div>
        </div>

        {/* Weekly Summary */}
        <h3 className="font-bold text-slate-100 mb-3 ml-1 text-lg">Weekly Summary</h3>
        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          
          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-950/50">
            <button className="text-primary active:scale-90"><ChevronLeft size={20} /></button>
            <span className="font-bold text-slate-100 text-sm">Apr 18 - Apr 25</span>
            <button className="text-primary active:scale-90"><ChevronRight size={20} /></button>
          </div>

          <div className="p-5 flex justify-between items-center">
            <div className="text-center flex-1 border-r border-slate-100">
              <p className="text-slate-400 text-xs font-semibold mb-1">Earning</p>
              <p className="font-bold text-slate-100 text-sm">${weeklySummary.earnings.toFixed(2)}</p>
            </div>
            <div className="text-center flex-1 border-r border-slate-100">
              <p className="text-slate-400 text-xs font-semibold mb-1">Work time</p>
              <p className="font-bold text-slate-100 text-sm">{weeklySummary.workTime}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-slate-500 text-xs font-semibold mb-1">Rides</p>
              <p className="font-bold text-slate-800 text-sm">{weeklySummary.rides}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
