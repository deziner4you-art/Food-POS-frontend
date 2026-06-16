import React, { useState } from 'react';
import { SavedCompletedMission } from '../types';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';

interface HistoryViewProps {
  trips: SavedCompletedMission[];
  onBack: () => void;
}

export default function HistoryView({ trips, onBack }: HistoryViewProps) {
  const [filter, setFilter] = useState<'All' | 'Complete' | 'Cancelled'>('All');

  const filteredTrips = trips.filter(trip => {
    if (filter === 'All') return true;
    if (filter === 'Complete') return true; // assuming all saved trips are complete for now
    return false;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 relative">
      {/* Header */}
      <div className="bg-primary text-slate-900 p-4 pt-6 pb-6 flex items-center shadow-md z-10 rounded-b-3xl">
        <button onClick={onBack} className="mr-4 active:scale-95 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-xl">History</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-100">
          {['All', 'Complete', 'Cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                filter === tab 
                  ? 'bg-primary text-slate-900 shadow-md' 
                  : 'text-slate-400 hover:bg-slate-950'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-4 pb-20">
          {filteredTrips.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>No trip history found.</p>
            </div>
          ) : (
            filteredTrips.map(trip => (
              <div key={trip.id} className="bg-primary-light/30 border border-primary-light p-4 rounded-2xl shadow-sm">
                
                <div className="flex justify-between items-center border-b border-primary-light/50 pb-3 mb-3">
                  <span className="font-mono text-sm font-bold text-slate-100">
                    #{trip.orderId || Math.floor(Math.random() * 10000000)}
                  </span>
                  <span className="bg-primary text-slate-900 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md">
                    Completed
                  </span>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <div className="flex-1">
                    <p className="text-primary font-semibold text-xs mb-1">Pickup</p>
                    <p className="text-sm font-bold text-slate-100 truncate pr-2">{trip.restaurant}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{trip.completedAt}</p>
                  </div>
                  
                  <div className="px-2">
                    <ArrowRight className="text-primary w-5 h-5" />
                  </div>

                  <div className="flex-1 text-right">
                    <p className="text-primary font-semibold text-xs mb-1">Drop off</p>
                    <p className="text-sm font-bold text-slate-100 truncate pl-2">{trip.customer}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{trip.completedAt}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-primary font-bold text-sm">
                    Earn <span className="text-slate-800">${trip.earnings.toFixed(2)}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-slate-800 font-bold text-sm">4.8</span>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
