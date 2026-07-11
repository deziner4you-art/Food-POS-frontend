import React, { useState, useEffect } from 'react';
import { Store, TrendingUp, PackageOpen, PieChart, AlertTriangle, Users, MapPin, RefreshCcw } from 'lucide-react';

const BACKEND_URL = 'http://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost') + ':3001';

export default function OwnerApp() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Live refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch high-level Brand overview
      const res = await fetch(`${BACKEND_URL}/reports/brand/1`);
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
        if (data.stores && data.stores.length > 0 && !selectedStore) {
          handleSelectStore(data.stores[0].store_id);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSelectStore = async (store_id: number) => {
    setSelectedStore(store_id);
    try {
      const res = await fetch(`${BACKEND_URL}/reports/daily?store_id=${store_id}`);
      if (res.ok) {
        setDailyData(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  if (loading || !overview) return <div className="h-screen w-screen flex justify-center items-center bg-gray-50"><RefreshCcw className="animate-spin text-purple-600" /></div>;

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20">
      {/* Mobile App Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-6 pt-12 shadow-lg rounded-b-3xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight">D4U Executive</h1>
            <p className="text-purple-200 text-sm font-medium">Live Analytics & Performance</p>
          </div>
          <button onClick={fetchData} className="p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all">
            <RefreshCcw size={20} />
          </button>
        </div>

        {/* Global KPI */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
          <p className="text-purple-100 text-sm font-medium mb-1 uppercase tracking-wider">Today's Brand Revenue</p>
          <div className="text-4xl font-black">Rs. {overview.grand_total?.toLocaleString() || 0}</div>
          <div className="mt-3 flex items-center gap-2 text-sm text-[#4edea3] bg-[#4edea3]/10 w-fit px-3 py-1 rounded-full">
            <TrendingUp size={14} /> +12% vs Yesterday
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Branch Selector */}
        <h2 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
          <Store size={18} className="text-purple-600" /> Active Branches
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {overview.stores.map((st: any) => (
            <button
              key={st.store_id}
              onClick={() => handleSelectStore(st.store_id)}
              className={`flex-shrink-0 px-5 py-3 rounded-2xl border transition-all font-bold text-sm ${
                selectedStore === st.store_id 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
              }`}
            >
              {st.store_name}
            </button>
          ))}
        </div>

        {/* Selected Store Deep Dive */}
        {dailyData && (
          <div className="mt-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0"></div>
                <PieChart size={20} className="text-blue-500 mb-2 relative z-10" />
                <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Sales</span>
                <span className="text-2xl font-black text-gray-800 relative z-10">Rs.{dailyData.totalSales.toLocaleString()}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full -z-0"></div>
                <PackageOpen size={20} className="text-green-500 mb-2 relative z-10" />
                <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Orders</span>
                <span className="text-2xl font-black text-gray-800 relative z-10">{dailyData.totalOrders}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -z-0"></div>
                <Users size={20} className="text-orange-500 mb-2 relative z-10" />
                <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Avg Value</span>
                <span className="text-2xl font-black text-gray-800 relative z-10">Rs.{Math.round(dailyData.avgOrderValue)}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-0"></div>
                <AlertTriangle size={20} className="text-red-500 mb-2 relative z-10" />
                <span className="text-gray-400 text-xs font-bold uppercase relative z-10">Voids</span>
                <span className="text-2xl font-black text-gray-800 relative z-10">{dailyData.voidedOrders}</span>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 shadow-sm mb-4">
              <h3 className="text-indigo-900 font-bold mb-2 flex items-center gap-2">✨ AI Insights</h3>
              <p className="text-sm text-indigo-700 leading-relaxed">
                Sales are up 12% at this branch compared to last week. The new <strong>Summer Weekend BOGO</strong> deal seems to be driving higher traffic. Keep an eye on inventory for top-selling items.
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <h3 className="text-gray-800 font-bold mb-3">Quick Actions</h3>
              <div className="flex gap-4">
                <button className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors">View Inventory</button>
                <button className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors">Rider Tracking</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
