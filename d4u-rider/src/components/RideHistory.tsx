import React from 'react';
import { SavedCompletedMission } from '../types';
import { Calendar, Tag, ShieldCheck, ClipboardList } from 'lucide-react';

interface RideHistoryProps {
  trips: SavedCompletedMission[];
  onClearHistory: () => void;
}

export default function RideHistory({ trips, onClearHistory }: RideHistoryProps) {
  return (
    <div className="bg-[#141b2b] p-5 rounded-2xl border border-slate-800 text-slate-200 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            📂 DISPATCHED ORDER HISTORY LOG
          </h2>
          <p className="text-[10px] text-slate-450 mt-0.5">Rider shifts database sync ledger</p>
        </div>
        {trips.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[10px] uppercase font-mono font-bold tracking-wide text-rose-455 hover:text-rose-400 cursor-pointer"
          >
            Clear Ledger
          </button>
        )}
      </div>

      {trips.length > 0 ? (
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
          {trips.map((trip) => (
            <div 
              key={trip.id} 
              className="bg-[#070e1d] p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between gap-2.5 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[8.5px] font-mono font-extrabold bg-[#141b2b] text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded mr-1.5 uppercase">
                    {trip.orderId}
                  </span>
                  <span className="text-[10.5px] font-mono text-slate-450">{trip.completedAt}</span>
                </div>
                
                <span className="text-[11px] font-mono font-extrabold text-emerald-400 tracking-tight">
                  +${trip.earnings.toFixed(2)}
                </span>
              </div>

              <div className="bg-[#141b2b]/50 p-2 rounded border border-slate-800/40 text-[11px] flex flex-col gap-1 text-left">
                <div>
                  <span className="text-slate-500 font-mono text-[9px] mr-1">🏪 SHOP:</span>
                  <span className="text-slate-300 font-bold">{trip.restaurant.split(' - ')[0]}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[9px] mr-1">🏠 CUST:</span>
                  <span className="text-slate-300 font-semibold">{trip.customer}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> POS Log Matched
                </span>
                <span>📦 {trip.itemsCount} dishes packed</span>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-[#070e1d] rounded-xl border border-slate-800/60">
          <div className="text-2xl mb-1 flex justify-center">📭</div>
          <p className="text-slate-400 text-xs font-semibold">Shift cargo log empty</p>
          <p className="text-[10px] text-slate-500 mt-1 max-w-[210px] mx-auto leading-normal">
            Orders from POS or Online board dispatches will materialize database rows here when successfully delivered.
          </p>
        </div>
      )}
    </div>
  );
}
