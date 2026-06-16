import React from 'react';
import { Sparkles, Award, Play, Square, Eye, EyeOff } from 'lucide-react';
import { RiderStats } from '../types';

interface StatsHubProps {
  stats: RiderStats;
  simSpeed: number;
  onSetSimSpeed: (speed: number) => void;
  onSkipStep: () => void;
  isTripActive: boolean;
}

export default function StatsHub({
  stats,
  simSpeed,
  onSetSimSpeed,
  onSkipStep,
  isTripActive
}: StatsHubProps) {
  
  return (
    <div className="bg-[#141b2b] p-5 rounded-2xl border border-slate-800 text-slate-200">
      <h2 className="font-display text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
        🛠️ LIVE DELIVERY SIMULATOR CONTROLS
      </h2>
      <p className="text-[11px] text-slate-400 leading-normal mb-4">
        Speed up the simulated GPS delivery scooter to travel between the restaurant kitchen and the customer's home faster.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Speed Multiplier controller */}
        <div className="bg-[#070e1d] p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time Travel Warp Speed</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: '1x Normal', val: 1 },
              { label: '2x Fast', val: 2 },
              { label: '6x Warp', val: 6 }
            ].map((s) => {
              const active = simSpeed === s.val;
              return (
                <button
                  key={`speed-btn-${s.val}`}
                  onClick={() => onSetSimSpeed(s.val)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono tracking-wide transition-colors cursor-pointer 
                    ${active 
                      ? 'bg-amber-400 text-slate-900 border border-amber-300' 
                      : 'bg-[#141b2b] text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Override controls */}
        <div className="bg-[#070e1d] p-3 rounded-xl border border-slate-800 flex flex-col gap-2 justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Route Override Action</p>
          <button
            onClick={onSkipStep}
            disabled={!isTripActive}
            className={`w-full py-1.5 px-3 rounded-lg text-[10.5px] font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer
              ${isTripActive 
                ? 'bg-rose-950/20 border-rose-900/40 text-rose-450 hover:bg-rose-900/10' 
                : 'bg-slate-900/30 border-slate-900 text-slate-650 cursor-not-allowed'
              }`}
          >
            <Square className="w-3.5 h-3.5" /> Fast Skip Current Driving Path
          </button>
        </div>

      </div>

      {/* Tip helper */}
      <p className="mt-3 text-[10.5px] text-slate-500 leading-normal flex items-start gap-1 font-sans">
        <span className="text-[#fbbf24] font-bold">💡 Tip:</span>
        Use "6x Warp" speed to make the delivery scooter navigate city streets instantly. Once the scooter completes its path, you will be prompted to pack the food items or request online payment.
      </p>

    </div>
  );
}
