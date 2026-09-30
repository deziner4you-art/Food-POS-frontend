import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Store, TrendingUp, PackageOpen, PieChart, AlertTriangle,
  Users, RefreshCcw, ArrowLeft, ShieldAlert, Building2,
  ChevronDown, Calendar, Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminContext } from '../context/AdminContext';
import { apiFetch } from '../utils/api';

// ─── Date helpers ────────────────────────────────────────────────────────────

type FilterPeriod = 'today' | 'yesterday' | 'weekly' | 'monthly' | 'yearly' | 'range';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
function nDaysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function firstDayOfMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function firstDayOfYearStr() {
  return `${new Date().getFullYear()}-01-01`;
}

function dateRangeForPeriod(period: FilterPeriod, customFrom: string, customTo: string): { from: string; to: string } {
  const today = todayStr();
  switch (period) {
    case 'today':      return { from: today,                to: today };
    case 'yesterday':  return { from: yesterdayStr(),        to: yesterdayStr() };
    case 'weekly':     return { from: nDaysAgoStr(6),        to: today };
    case 'monthly':    return { from: firstDayOfMonthStr(),  to: today };
    case 'yearly':     return { from: firstDayOfYearStr(),   to: today };
    case 'range':      return { from: customFrom || nDaysAgoStr(6), to: customTo || today };
  }
}

const PERIOD_LABELS: Record<FilterPeriod, string> = {
  today:     "Today",
  yesterday: "Yesterday",
  weekly:    "This Week",
  monthly:   "This Month",
  yearly:    "This Year",
  range:     "Date Range",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerApp() {
  const navigate = useNavigate();
  const { activeBrandId, setActiveBrandId, brands, branches, selectedBranchId } = useAdminContext();

  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [overview, setOverview]         = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);

  // Filter state
  const [period, setPeriod]             = useState<FilterPeriod>('today');
  const [customFrom, setCustomFrom]     = useState(nDaysAgoStr(6));
  const [customTo, setCustomTo]         = useState(todayStr());
  const [filterData, setFilterData]     = useState<any>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  // Authenticated user
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('d4u_admin_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  // Effective brand
  const effectiveBrandId = useMemo(() => {
    return (
      activeBrandId ||
      user?.brand_id ||
      user?.active_brand_id ||
      user?.brand?.id ||
      (brands && brands.length > 0 ? brands[0].id : null)
    );
  }, [activeBrandId, user, brands]);

  // Brand display name
  const brandName = useMemo(() => {
    if (!effectiveBrandId) return 'My Brand';
    const found = brands.find((b: any) => b.id === effectiveBrandId);
    return found?.name || 'My Brand';
  }, [effectiveBrandId, brands]);

  // Sync context brand
  useEffect(() => {
    if (!activeBrandId && effectiveBrandId) setActiveBrandId(effectiveBrandId);
  }, [activeBrandId, effectiveBrandId, setActiveBrandId]);

  // ── Fetch overview (brand level, always today) ──────────────────────────────
  const fetchOverview = useCallback(async () => {
    if (!effectiveBrandId) {
      if (brands.length === 0) { setLoading(true); return; }
      setLoading(false);
      setError('No brand workspace assigned. Please ensure your account belongs to a brand.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const candidateStoreId =
        selectedStore ||
        selectedBranchId ||
        user?.active_store_id ||
        user?.store_id ||
        (branches.length > 0 ? branches[0].id : null);

      const url = candidateStoreId
        ? `/reports/brand/${effectiveBrandId}?store_id=${candidateStoreId}`
        : `/reports/brand/${effectiveBrandId}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
        if (data.stores && data.stores.length > 0) {
          const firstId = selectedStore && data.stores.some((s: any) => s.store_id === selectedStore)
            ? selectedStore
            : data.stores[0].store_id;
          setSelectedStore(firstId);
        } else {
          setSelectedStore(null);
        }
      } else {
        const errJson = await res.json().catch(() => null);
        const reason  = errJson?.reason || errJson?.message;
        if (res.status === 403) {
          if (reason === 'SUBSCRIPTION_NOT_FOUND')
            setError('SaaS Subscription Not Found: This brand does not have an active package subscription assigned.');
          else if (reason === 'ACTIVE_STORE_REQUIRED')
            setError('Active store context is required. Please ensure at least one store is active.');
          else
            setError(`Access Denied (403): ${reason || "Account lacks 'finance.reports.view' or Analytics subscription."}`);
        } else {
          setError(`Unable to load brand reports (${res.status}): ${reason || res.statusText}`);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Network error connecting to backend service.');
    } finally {
      setLoading(false);
    }
  }, [effectiveBrandId, selectedStore, selectedBranchId, user, brands, branches]);

  // ── Fetch filtered data for selected store + period ─────────────────────────
  const fetchFilteredData = useCallback(async (storeId: number, p: FilterPeriod, cFrom: string, cTo: string) => {
    if (!storeId) return;
    setFilterLoading(true);
    setFilterData(null);
    try {
      const { from, to } = dateRangeForPeriod(p, cFrom, cTo);

      // For today/yesterday use the daily endpoint; for ranges use branch-analytics
      let res: Response;
      if (p === 'today') {
        res = await apiFetch(`/reports/daily?store_id=${storeId}&date=${from}`);
      } else if (p === 'yesterday') {
        res = await apiFetch(`/reports/daily?store_id=${storeId}&date=${from}`);
      } else {
        res = await apiFetch(`/reports/branch-analytics?store_id=${storeId}&start_date=${from}&end_date=${to}`);
      }

      if (res.ok) {
        const data = await res.json();
        setFilterData(data);
      } else {
        setFilterData(null);
      }
    } catch {
      setFilterData(null);
    } finally {
      setFilterLoading(false);
    }
  }, []);

  // Auto-load on mount and every 30s
  useEffect(() => {
    fetchOverview();
    const iv = setInterval(fetchOverview, 30000);
    return () => clearInterval(iv);
  }, [effectiveBrandId]);

  // Fetch filtered data whenever store or period changes
  useEffect(() => {
    if (selectedStore) fetchFilteredData(selectedStore, period, customFrom, customTo);
  }, [selectedStore, period, customFrom, customTo]);

  // ── Store dropdown change ────────────────────────────────────────────────────
  const handleStoreChange = (storeId: number) => {
    setSelectedStore(storeId);
    fetchFilteredData(storeId, period, customFrom, customTo);
  };

  // ── Period change ────────────────────────────────────────────────────────────
  const handlePeriodChange = (p: FilterPeriod) => {
    setPeriod(p);
    if (p !== 'range' && selectedStore) {
      fetchFilteredData(selectedStore, p, customFrom, customTo);
    }
  };

  const applyCustomRange = () => {
    if (selectedStore) fetchFilteredData(selectedStore, 'range', customFrom, customTo);
  };

  // ── Helper: normalise API response fields for display ───────────────────────
  const getSalesValue   = () => filterData?.totalSales   ?? filterData?.total_sales  ?? 0;
  const getOrdersValue  = () => filterData?.totalOrders  ?? filterData?.total_orders ?? 0;
  const getAvgValue     = () => filterData?.avgOrderValue ?? filterData?.avg_order_value ?? 0;
  const getVoidsValue   = () => filterData?.voidedOrders  ?? filterData?.voided_orders  ?? 0;
  const getDiscountValue = () => filterData?.totalDiscount ?? filterData?.total_discount ?? 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading / error / empty states
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading && !overview) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-50 p-6 text-center">
        <RefreshCcw className="animate-spin text-purple-600 mb-4" size={36} />
        <h2 className="text-xl font-bold text-gray-800">Loading Analytics...</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">Fetching live revenue and branch performance data</p>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Notice</h2>
          <p className="text-sm text-gray-600 mb-6 bg-red-50 p-4 rounded-xl border border-red-100 text-left font-mono">{error}</p>
          <div className="flex flex-col gap-3">
            <button onClick={fetchOverview} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2">
              <RefreshCcw size={18} /> Retry
            </button>
            {user?.role === 'Super Admin' && (
              <button onClick={() => navigate('/saas')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                Go to SaaS Setup
              </button>
            )}
            <button onClick={() => navigate('/')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <ArrowLeft size={18} /> Back to HQ Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-50 p-6 text-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-gray-100">
          <Store className="text-purple-600 mx-auto mb-4" size={40} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Branches Found</h2>
          <p className="text-sm text-gray-500 mb-6">There are no operational stores registered under this brand yet.</p>
          <div className="flex flex-col gap-3">
            <button onClick={fetchOverview} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors">Refresh</button>
            <button onClick={() => navigate('/')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors">Back to HQ Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const storeList: any[] = overview.stores || [];
  const selectedStoreObj = storeList.find((s: any) => s.store_id === selectedStore);

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-24">

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white px-5 pt-10 pb-6 shadow-lg rounded-b-3xl">
        <div className="flex justify-between items-center mb-5">
          {/* Left: back + brand name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition-all text-white"
              title="Return to HQ"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-tight">{brandName}</h1>
              <p className="text-purple-200 text-xs font-medium">Live Analytics &amp; Performance</p>
            </div>
          </div>

          {/* Right: brand switcher + refresh */}
          <div className="flex items-center gap-2">
            {brands.length > 1 && (
              <select
                value={effectiveBrandId || ''}
                onChange={(e) => setActiveBrandId(Number(e.target.value))}
                className="bg-white/10 border border-white/20 text-white rounded-xl text-xs font-bold px-2 py-1.5 outline-none"
              >
                {brands.map((b: any) => (
                  <option key={b.id} value={b.id} className="text-gray-900">{b.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Today's brand total */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
          <p className="text-purple-100 text-xs font-bold mb-1 uppercase tracking-wider">Today's Brand Revenue</p>
          <div className="text-4xl font-black">Rs. {(overview.grand_total || 0).toLocaleString()}</div>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#4edea3] bg-[#4edea3]/10 w-fit px-3 py-1 rounded-full">
            <TrendingUp size={14} /> Live Total from {storeList.length} Branch{storeList.length !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-5">

        {/* ── Branch Dropdown ─────────────────────────────────────────────── */}
        <div>
          <label className="text-gray-700 font-bold text-sm flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-purple-600" />
            Choose Branch
          </label>
          <div className="relative">
            <select
              value={selectedStore || ''}
              onChange={(e) => handleStoreChange(Number(e.target.value))}
              className="w-full appearance-none bg-white border-2 border-purple-200 focus:border-purple-500 text-gray-800 font-semibold text-sm rounded-2xl px-4 py-3 pr-10 outline-none transition-all shadow-sm"
            >
              {storeList.length === 0 && (
                <option value="">No branches available</option>
              )}
              {storeList.map((st: any) => (
                <option key={st.store_id} value={st.store_id}>
                  {st.store_name} — Rs. {(st.today_sales || 0).toLocaleString()} today
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
          </div>
          {selectedStoreObj && (
            <p className="text-xs text-gray-400 mt-1.5 pl-1">
              Showing data for: <span className="text-purple-700 font-bold">{selectedStoreObj.store_name}</span>
            </p>
          )}
        </div>

        {/* ── Period Filter ────────────────────────────────────────────────── */}
        {selectedStore && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-gray-700 font-bold text-sm flex items-center gap-2 mb-3">
              <Filter size={15} className="text-purple-600" /> Filter Period
            </h3>

            {/* Period pill buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {(Object.keys(PERIOD_LABELS) as FilterPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    period === p
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-700'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Date range pickers (only when 'range' selected) */}
            {period === 'range' && (
              <div className="flex gap-3 items-end mt-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-bold mb-1 block">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo || todayStr()}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-purple-400 bg-gray-50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-bold mb-1 block">To</label>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    max={todayStr()}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-purple-400 bg-gray-50"
                  />
                </div>
                <button
                  onClick={applyCustomRange}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-sm shrink-0"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        {selectedStore && (
          <>
            {filterLoading ? (
              <div className="flex justify-center items-center py-10">
                <RefreshCcw className="animate-spin text-purple-600" size={24} />
              </div>
            ) : filterData ? (
              <div className="animate-fade-in space-y-4">

                {/* Period label */}
                <p className="text-xs text-gray-400 font-semibold pl-1">
                  <Calendar size={12} className="inline mr-1 text-purple-400" />
                  {PERIOD_LABELS[period]}
                  {period === 'range' && ` (${customFrom} → ${customTo})`}
                  {(period === 'weekly' || period === 'monthly' || period === 'yearly') &&
                    ` (${dateRangeForPeriod(period, customFrom, customTo).from} → ${dateRangeForPeriod(period, customFrom, customTo).to})`
                  }
                </p>

                {/* 2×2 stat grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Sales */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full" />
                    <PieChart size={20} className="text-blue-500 mb-2 relative z-10" />
                    <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Sales</span>
                    <span className="text-2xl font-black text-gray-800 relative z-10">Rs.{getSalesValue().toLocaleString()}</span>
                  </div>
                  {/* Orders */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full" />
                    <PackageOpen size={20} className="text-green-500 mb-2 relative z-10" />
                    <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Orders</span>
                    <span className="text-2xl font-black text-gray-800 relative z-10">{getOrdersValue()}</span>
                  </div>
                  {/* Avg Value */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full" />
                    <Users size={20} className="text-orange-500 mb-2 relative z-10" />
                    <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Avg Value</span>
                    <span className="text-2xl font-black text-gray-800 relative z-10">Rs.{Math.round(getAvgValue()).toLocaleString()}</span>
                  </div>
                  {/* Voids */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full" />
                    <AlertTriangle size={20} className="text-red-500 mb-2 relative z-10" />
                    <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Voids</span>
                    <span className="text-2xl font-black text-gray-800 relative z-10">{getVoidsValue()}</span>
                  </div>
                </div>

                {/* Discount row (if available) */}
                {getDiscountValue() > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-bold uppercase">Total Discount Given</span>
                    <span className="text-indigo-700 font-black text-lg">Rs.{getDiscountValue().toLocaleString()}</span>
                  </div>
                )}

                {/* AI Insights */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
                  <h3 className="text-indigo-900 font-bold mb-2 flex items-center gap-2 text-sm">✨ AI Insights</h3>
                  <p className="text-sm text-indigo-700 leading-relaxed">
                    Branch telemetry active. Revenue and order counts for{' '}
                    <strong>{PERIOD_LABELS[period].toLowerCase()}</strong> reflect verified receipts only.
                    Top-moving items and stock alerts update in real-time.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <h3 className="text-gray-800 font-bold mb-3 text-sm">Quick Actions</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate('/')}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors text-sm"
                    >
                      HQ Dashboard
                    </button>
                    <button
                      onClick={() => { fetchOverview(); if (selectedStore) fetchFilteredData(selectedStore, period, customFrom, customTo); }}
                      className="flex-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold py-3 rounded-xl transition-colors text-sm"
                    >
                      Refresh Live
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                <Store size={32} className="mx-auto mb-3 opacity-30" />
                No data for the selected period. Try a different filter or refresh.
              </div>
            )}
          </>
        )}

        {!selectedStore && storeList.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm italic">
            No branches found for this brand.
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-in { animation: fade-in 0.25s ease forwards; }
      ` }} />
    </div>
  );
}
