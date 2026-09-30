import React, { useState, useEffect, useMemo } from 'react';
import { Store, TrendingUp, PackageOpen, PieChart, AlertTriangle, Users, RefreshCcw, ArrowLeft, ShieldAlert, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminContext } from '../context/AdminContext';
import { apiFetch } from '../utils/api';

export default function OwnerApp() {
  const navigate = useNavigate();
  const { activeBrandId, setActiveBrandId, brands, branches, selectedBranchId } = useAdminContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [dailyData, setDailyData] = useState<any>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Authenticated user from local storage
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('d4u_admin_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Determine effective brand ID with fallback hierarchy
  const effectiveBrandId = useMemo(() => {
    return (
      activeBrandId ||
      user?.brand_id ||
      user?.active_brand_id ||
      user?.brand?.id ||
      (brands && brands.length > 0 ? brands[0].id : null)
    );
  }, [activeBrandId, user, brands]);

  // Sync activeBrandId in context if not yet selected
  useEffect(() => {
    if (!activeBrandId && effectiveBrandId) {
      setActiveBrandId(effectiveBrandId);
    }
  }, [activeBrandId, effectiveBrandId, setActiveBrandId]);

  const fetchData = async () => {
    if (!effectiveBrandId) {
      // If brands haven't finished loading yet, wait without error
      if (brands.length === 0) {
        setLoading(true);
        return;
      }
      setLoading(false);
      setError('No brand workspace assigned. Please ensure your account belongs to a brand.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find candidate store_id to satisfy module entitlement guard
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
          const storeIdToSelect =
            selectedStore && data.stores.some((s: any) => s.store_id === selectedStore)
              ? selectedStore
              : data.stores[0].store_id;
          handleSelectStore(storeIdToSelect);
        } else {
          setSelectedStore(null);
          setDailyData(null);
        }
      } else {
        const errJson = await res.json().catch(() => null);
        const reason = errJson?.reason || errJson?.message;
        if (res.status === 403) {
          if (reason === 'SUBSCRIPTION_NOT_FOUND') {
            setError('SaaS Subscription Not Found: This brand does not have an active package subscription assigned. An active subscription is required to view live reporting.');
          } else if (reason === 'ACTIVE_STORE_REQUIRED') {
            setError('Active store context is required. Please ensure at least one store is active in this brand.');
          } else {
            setError(`Access Denied (403): ${reason || "Account lacks 'finance.reports.view' or Analytics subscription."}`);
          }
        } else {
          setError(`Unable to load brand reports (${res.status}): ${reason || res.statusText}`);
        }
      }
    } catch (e: any) {
      console.error('OwnerApp fetch error:', e);
      setError(e?.message || 'Network error connecting to backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Live refresh every 30s
    return () => clearInterval(interval);
  }, [effectiveBrandId]);

  const handleSelectStore = async (store_id: number) => {
    setSelectedStore(store_id);
    setDailyLoading(true);
    try {
      const res = await apiFetch(`/reports/daily?store_id=${store_id}`);
      if (res.ok) {
        setDailyData(await res.json());
      }
    } catch (e) {
      console.error('Daily store report error:', e);
    } finally {
      setDailyLoading(false);
    }
  };

  // 1. Initial Loading State
  if (loading && !overview) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-50 p-6 text-center">
        <RefreshCcw className="animate-spin text-purple-600 mb-4" size={36} />
        <h2 className="text-xl font-bold text-gray-800">Loading Executive Analytics...</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">Fetching live revenue and store performance data</p>
      </div>
    );
  }

  // 2. Error State
  if (error && !overview) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Notice</h2>
          <p className="text-sm text-gray-600 mb-6 bg-red-50 p-4 rounded-xl border border-red-100 text-left font-mono">
            {error}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={fetchData}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              <RefreshCcw size={18} /> Retry
            </button>
            {user?.role === 'Super Admin' && (
              <button
                onClick={() => navigate('/saas')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                Go to SaaS Setup
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Back to HQ Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Empty State (no overview)
  if (!overview) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-50 p-6 text-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-gray-100">
          <Store className="text-purple-600 mx-auto mb-4" size={40} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Branches Found</h2>
          <p className="text-sm text-gray-500 mb-6">There are no operational stores registered under this brand yet.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={fetchData}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
            >
              Back to HQ Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20">
      {/* Mobile App Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-6 pt-10 shadow-lg rounded-b-3xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition-all text-white"
              title="Return to HQ"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight">D4U Executive</h1>
              <p className="text-purple-200 text-xs font-medium">Live Analytics & Performance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {brands.length > 1 && (
              <select
                value={effectiveBrandId || ''}
                onChange={(e) => setActiveBrandId(Number(e.target.value))}
                className="bg-white/10 border border-white/20 text-white rounded-xl text-xs font-bold px-2 py-1.5 outline-none"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id} className="text-gray-900">
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Global KPI */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
          <p className="text-purple-100 text-xs font-bold mb-1 uppercase tracking-wider">Today's Brand Revenue</p>
          <div className="text-4xl font-black">Rs. {overview.grand_total?.toLocaleString() || 0}</div>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#4edea3] bg-[#4edea3]/10 w-fit px-3 py-1 rounded-full">
            <TrendingUp size={14} /> Live Total from {overview.stores?.length || 0} Branches
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Branch Selector */}
        <h2 className="text-gray-800 font-bold mb-3 flex items-center gap-2 text-sm">
          <Store size={18} className="text-purple-600" /> Active Branches
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {overview.stores?.map((st: any) => (
            <button
              key={st.store_id}
              onClick={() => handleSelectStore(st.store_id)}
              className={`flex-shrink-0 px-5 py-3 rounded-2xl border transition-all font-bold text-sm ${
                selectedStore === st.store_id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
              }`}
            >
              <div>{st.store_name}</div>
              <div className={`text-xs mt-0.5 ${selectedStore === st.store_id ? 'text-purple-200' : 'text-gray-400'}`}>
                Rs. {(st.today_sales || 0).toLocaleString()}
              </div>
            </button>
          ))}
          {(!overview.stores || overview.stores.length === 0) && (
            <div className="text-sm text-gray-500 italic p-3">No branch sales recorded today.</div>
          )}
        </div>

        {/* Selected Store Deep Dive */}
        {dailyLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCcw className="animate-spin text-purple-600" size={24} />
          </div>
        ) : dailyData ? (
          <div className="mt-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0"></div>
                <PieChart size={20} className="text-blue-500 mb-2 relative z-10" />
                <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Sales</span>
                <span className="text-2xl font-black text-gray-800 relative z-10">Rs.{dailyData.totalSales?.toLocaleString() || 0}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full -z-0"></div>
                <PackageOpen size={20} className="text-green-500 mb-2 relative z-10" />
                <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Orders</span>
                <span className="text-2xl font-black text-gray-800 relative z-10">{dailyData.totalOrders || 0}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -z-0"></div>
                <Users size={20} className="text-orange-500 mb-2 relative z-10" />
                <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Avg Value</span>
                <span className="text-2xl font-black text-gray-800 relative z-10">Rs.{Math.round(dailyData.avgOrderValue || 0)}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-0"></div>
                <AlertTriangle size={20} className="text-red-500 mb-2 relative z-10" />
                <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Voids</span>
                <span className="text-2xl font-black text-gray-800 relative z-10">{dailyData.voidedOrders || 0}</span>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 shadow-sm mb-4">
              <h3 className="text-indigo-900 font-bold mb-2 flex items-center gap-2">✨ AI Insights</h3>
              <p className="text-sm text-indigo-700 leading-relaxed">
                Live branch telemetry active. Orders and revenue reflect today's verified receipts. Top-moving items and stock alerts are updated in real-time.
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
                  onClick={fetchData}
                  className="flex-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Refresh Live
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
