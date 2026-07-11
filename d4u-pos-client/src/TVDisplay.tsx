import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { CheckCircle2, Clock } from 'lucide-react';

export default function TVDisplay() {
  const activeKots = useLiveQuery(
    () => db.kots.where('status').anyOf(['PREPARING', 'READY']).toArray()
  ) || [];

  const preparing = activeKots.filter(k => k.status === 'PREPARING');
  const ready = activeKots.filter(k => k.status === 'READY');

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-[#1e293b] border-b border-slate-700 py-6 px-10 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#fbbf24] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <span className="text-3xl font-black text-slate-900">D4U</span>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase">Order Status</h1>
            <p className="text-[#fbbf24] font-bold text-lg tracking-widest">Please wait for your number</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-5xl font-black tabular-nums tracking-tight">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex w-full">
        {/* PREPARING COLUMN */}
        <div className="flex-1 flex flex-col border-r border-slate-800">
          <div className="bg-slate-800/50 py-6 text-center border-b border-slate-700/50">
            <h2 className="text-4xl font-black text-white tracking-widest flex items-center justify-center gap-4">
              <Clock className="w-10 h-10 text-slate-400" />
              PREPARING
            </h2>
          </div>
          <div className="flex-1 p-8 bg-[#0f172a]">
            <div className="grid grid-cols-2 gap-6 auto-rows-max">
              {preparing.length === 0 && (
                <div className="col-span-2 text-center py-20 text-slate-600 font-bold text-2xl">
                  No orders preparing
                </div>
              )}
              {preparing.map(kot => (
                <div key={kot.id} className="bg-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center border-2 border-slate-700/50 shadow-lg">
                  <span className="text-[#fbbf24] font-bold text-xl mb-2">{kot.type}</span>
                  <span className="text-7xl font-black text-white tabular-nums tracking-tighter">#{kot.orderId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* READY COLUMN */}
        <div className="flex-1 flex flex-col bg-[#022c22]">
          <div className="bg-[#064e3b] py-6 text-center border-b border-[#047857] shadow-md">
            <h2 className="text-4xl font-black text-[#34d399] tracking-widest flex items-center justify-center gap-4">
              <CheckCircle2 className="w-10 h-10" />
              PLEASE COLLECT
            </h2>
          </div>
          <div className="flex-1 p-8 bg-[#022c22]">
            <div className="grid grid-cols-2 gap-6 auto-rows-max">
              {ready.length === 0 && (
                <div className="col-span-2 text-center py-20 text-[#065f46] font-bold text-2xl">
                  No orders ready for collection
                </div>
              )}
              {ready.map(kot => (
                <div key={kot.id} className="bg-[#059669] rounded-3xl p-6 flex flex-col items-center justify-center border-4 border-[#34d399] shadow-[0_0_30px_rgba(52,211,153,0.3)] transform transition-transform animate-pulse-slow">
                  <span className="text-[#a7f3d0] font-bold text-xl mb-2">{kot.type}</span>
                  <span className="text-7xl font-black text-white tabular-nums tracking-tighter drop-shadow-md">#{kot.orderId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .animate-pulse-slow {
          animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-border {
          0%, 100% {
            border-color: #34d399;
            box-shadow: 0 0 30px rgba(52,211,153,0.3);
          }
          50% {
            border-color: #10b981;
            box-shadow: 0 0 15px rgba(52,211,153,0.1);
          }
        }
      `}</style>
    </div>
  );
}
