import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, isValidPosIntegerId } from './db';
import { CheckCircle2, Clock } from 'lucide-react';
import { isKotEligible } from './utils/kotEligibility';
import { apiFetch } from './pos/api';

/**
 * TVDisplay — legacy /tv route renderer.
 *
 * Task #3A: applies the SAME identity gate as StitchKDS and TvBoard.
 * A KOT is NEVER rendered unless:
 *   - currentStoreId is known (loaded from localStorage session)
 *   - activeBusinessDayId is known (fetched from backend or cached per-store)
 *   - k.store_id === currentStoreId
 *   - k.businessDayId === activeBusinessDayId
 *
 * NO hardcoded || 1 fallbacks. If either identity is absent, zero KOTs render.
 */
export default function TVDisplay() {
  // Read the user session from localStorage — the same source TvBoard uses.
  let user: any = null;
  try {
    user = JSON.parse(localStorage.getItem('d4u_main_user') || 'null');
  } catch (e) {
    console.error('[TVDisplay] Corrupt d4u_main_user in localStorage, ignoring:', e);
  }

  // RULE 1: No || 1 fallback. undefined means "no session" and zero KOTs render.
  const currentStoreId: number | undefined = user?.store_id || undefined;

  // Remediation Batch 3 (Finding 4): TVDisplay MUST fail closed.
  // Never initialize from stale cached business day or retain cached ID on network failure.
  const [activeBusinessDayId, setActiveBusinessDayId] = useState<number | null>(null);

  // Fetch and verify the authoritative current business day for this store on mount.
  // If backend indicates no active business day or network request fails, activeBusinessDayId is null.
  useEffect(() => {
    if (!currentStoreId) return;
    apiFetch(`/business-day/current?store_id=${currentStoreId}`, { auth: true })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && isValidPosIntegerId(data.id)) {
          setActiveBusinessDayId(data.id);
          localStorage.setItem(`d4u_active_business_day_${currentStoreId}`, String(data.id));
        } else {
          setActiveBusinessDayId(null);
          localStorage.removeItem(`d4u_active_business_day_${currentStoreId}`);
        }
      })
      .catch(() => {
        // Network failure / offline: fail closed. Stale cached business day must NOT render.
        setActiveBusinessDayId(null);
        localStorage.removeItem(`d4u_active_business_day_${currentStoreId}`);
      });
  }, [currentStoreId]);

  // Clock tick for header time display
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const allKots = useLiveQuery(
    () => db.kots.where('status').anyOf(['PREPARING', 'READY']).toArray()
  ) || [];

  // Task #3A identity gate — applied uniformly to EVERY KOT before it can render.
  const eligibleKots = allKots.filter(k =>
    isKotEligible(k, currentStoreId, activeBusinessDayId)
  );

  const preparing = eligibleKots.filter(k => k.status === 'PREPARING');
  const ready = eligibleKots.filter(k => k.status === 'READY');

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
            {new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
