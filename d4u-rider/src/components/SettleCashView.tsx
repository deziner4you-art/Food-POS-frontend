import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, RefreshCw } from 'lucide-react';
import { RiderActivityRecord } from '../types';
import { formatCurrency } from '../utils';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : 'https://pos-api.deziner4you.com';

type ActivityPeriod = 'today' | 'weekly' | 'monthly' | 'custom';

interface SettleCashViewProps {
  onBack: () => void;
  onSettle: () => void;
  riderStoreId: number | null;
  riderId: string;
  riderToken: string | null;
}

const localDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateAtStart = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const nextDay = (date: Date) => {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result;
};

const formatActivityDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
};

const amountOf = (record: RiderActivityRecord) => {
  const amount = Number(record.totalAmount ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

export default function SettleCashView({
  onBack,
  onSettle,
  riderStoreId,
  riderId,
  riderToken,
}: SettleCashViewProps) {
  const today = localDate(new Date());
  const [period, setPeriod] = useState<ActivityPeriod>('today');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [records, setRecords] = useState<RiderActivityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const range = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (period === 'today') {
      start = dateAtStart(today);
      end = nextDay(start);
    } else if (period === 'weekly') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
      end = nextDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
    } else if (period === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else {
      start = dateAtStart(customFrom);
      end = nextDay(dateAtStart(customTo));
    }

    return { start, end };
  }, [period, today, customFrom, customTo]);

  const rangeLabel = useMemo(() => {
    const start = range.start.toLocaleDateString();
    const end = new Date(range.end.getTime() - 1).toLocaleDateString();
    return `${start} - ${end}`;
  }, [range]);

  useEffect(() => {
    if (!riderStoreId || !riderId || !riderToken || range.start >= range.end) {
      setRecords([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      store_id: String(riderStoreId),
      from: range.start.toISOString(),
      to: range.end.toISOString(),
    });

    fetch(`${BACKEND_URL}/rider-orders/activity?${params.toString()}`, {
      headers: { Authorization: `Bearer ${riderToken}` },
    })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.message || 'Unable to load rider activity.');
        return body;
      })
      .then(body => {
        if (!cancelled) setRecords(Array.isArray(body?.records) ? body.records : []);
      })
      .catch(loadError => {
        if (!cancelled) {
          setRecords([]);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load rider activity.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [riderStoreId, riderId, riderToken, range]);

  const summary = useMemo(() => {
    const totalValue = records.reduce((sum, record) => sum + amountOf(record), 0);
    const pendingCash = records
      .filter(record => ['DELIVERED', 'WAITING_CASH_SETTLEMENT'].includes(record.activityStatus || record.status || ''))
      .reduce((sum, record) => sum + amountOf(record), 0);
    const settledCash = records
      .filter(record => (record.activityStatus || record.status) === 'SETTLED')
      .reduce((sum, record) => sum + amountOf(record), 0);
    const timestamps = records
      .map(record => new Date(record.activityAt).getTime())
      .filter(value => Number.isFinite(value))
      .sort((a, b) => a - b);
    const activitySpan = timestamps.length > 1
      ? `${new Date(timestamps[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(timestamps[timestamps.length - 1]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : timestamps.length === 1 ? '1 recorded time' : '—';

    return { totalValue, pendingCash, settledCash, activitySpan };
  }, [records]);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      <div className="bg-primary text-slate-900 p-4 pt-6 pb-8 rounded-b-3xl z-10 relative">
        <button onClick={onBack} className="mb-5 active:scale-95 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-2xl mb-1">Rider Activity</h1>
        <p className="text-slate-900/75 text-sm mb-4">Pending COD in this selected period</p>
        <div className="text-5xl font-display font-extrabold mb-5 tracking-tight">
          {formatCurrency(summary.pendingCash)}
        </div>
        <button onClick={onSettle} className="bg-slate-900 text-primary font-bold py-3 px-8 rounded-full shadow-lg active:scale-95 transition-transform">
          Settle with POS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 mt-[-16px] relative z-20">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-2 mb-6 grid grid-cols-4 gap-1">
          {([
            ['today', 'Today'],
            ['weekly', 'Weekly'],
            ['monthly', 'Monthly'],
            ['custom', 'Date Range'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold ${period === value ? 'bg-primary text-slate-900' : 'text-slate-400'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 mb-6 grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-400 font-semibold">From<input type="date" value={customFrom} onChange={event => setCustomFrom(event.target.value)} className="mt-1 w-full bg-slate-950 text-slate-100 rounded-lg p-2 text-sm" /></label>
            <label className="text-xs text-slate-400 font-semibold">To<input type="date" value={customTo} min={customFrom} onChange={event => setCustomTo(event.target.value)} className="mt-1 w-full bg-slate-950 text-slate-100 rounded-lg p-2 text-sm" /></label>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 ml-1">
          <h3 className="font-bold text-slate-100 text-lg">Activity</h3>
          <span className="text-xs text-slate-400">{rangeLabel}</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400"><RefreshCw size={22} className="animate-spin mx-auto mb-2" />Loading exact records...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-300 bg-red-500/10 rounded-2xl border border-red-500/30">{error}</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">No rider activity in this period.</div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {records.map(record => {
              const status = record.activityStatus || record.status || 'UNKNOWN';
              return (
                <div key={record.logicalDeliveryKey || `${record.entityType}:${record.entityId}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono font-bold text-slate-100">{record.entityType} #{record.entityId}</span>
                    <span className="text-[10px] font-bold uppercase bg-slate-800 text-primary px-2 py-1 rounded-md">{status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{record.customer || 'Customer'}</span>
                    <span>{formatActivityDate(record.activityAt)}</span>
                  </div>
                  <div className="flex justify-between mt-3 pt-2 border-t border-slate-800 text-sm">
                    <span className="text-slate-400">Delivery value</span>
                    <span className="font-bold text-slate-100">{formatCurrency(amountOf(record))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h3 className="font-bold text-slate-100 mb-3 ml-1 text-lg">Summary</h3>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 grid grid-cols-2 gap-4">
          <div><p className="text-slate-400 text-xs">Rides</p><p className="font-bold text-slate-100 text-lg">{records.length}</p></div>
          <div><p className="text-slate-400 text-xs">Delivery value</p><p className="font-bold text-slate-100 text-lg">{formatCurrency(summary.totalValue)}</p></div>
          <div><p className="text-slate-400 text-xs">Settled with POS</p><p className="font-bold text-slate-100 text-lg">{formatCurrency(summary.settledCash)}</p></div>
          <div><p className="text-slate-400 text-xs">Recorded activity span</p><p className="font-bold text-slate-100 text-sm">{summary.activitySpan}</p></div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-4 px-1">
          <CalendarDays size={14} /> Records come from the authenticated rider activity report.
        </div>
      </div>
    </div>
  );
}
