import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Store, AlertCircle, ArrowRight } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { customAlert } from '../utils/alerts';

const BACKEND_URL = 'http://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost') + ':3001';

export default function Dashboard() {
  const [brandOverview, setBrandOverview] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { branches, selectedBranchId, setSelectedBranchId, setIsBranchEntered } = useAdminContext();


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const storeIdParam = selectedBranchId ? selectedBranchId : 1; // Default to 1 if no "All" aggregation backend
        
        const [brandRes, weeklyRes, productsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/reports/brand/1`),
          fetch(`${BACKEND_URL}/reports/weekly?store_id=${storeIdParam}`),
          fetch(`${BACKEND_URL}/reports/top-products?store_id=${storeIdParam}&limit=5`)
        ]);

        if (brandRes.ok) {
          const brandData = await brandRes.json();
          setBrandOverview(Array.isArray(brandData) ? brandData : []);
        }
        if (weeklyRes.ok) {
          const weeklyData = await weeklyRes.json();
          setWeeklyTrend(Array.isArray(weeklyData) ? weeklyData : []);
        }
        if (productsRes.ok) {
          const prods = await productsRes.json();
          // Map to standard format for charts
          setTopProducts(Array.isArray(prods) ? prods.map((p: any) => ({
            name: p.product?.name || 'Unknown',
            qty: p.total_qty,
            orders: p.total_orders
          })) : []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedBranchId]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-slate-500">Loading Analytics...</div>;
  }

  // Calculate Revenue
  const filteredOverview = selectedBranchId ? brandOverview.filter(b => b.store_id === selectedBranchId) : brandOverview;
  const totalRevenue = filteredOverview.reduce((sum, store) => sum + store.today_sales, 0);
  const totalOrders = filteredOverview.reduce((sum, store) => sum + store.today_orders, 0);

  const handleEnterBranch = () => {
    if (!selectedBranchId || selectedBranchId === 0) {
      customAlert("Please select a valid branch first.");
      return;
    }
    setIsBranchEntered(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white">Live Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">Real-time performance across branches</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="text-slate-400 font-bold text-sm">Filter:</span>
            <select 
              value={selectedBranchId || ''} 
              onChange={e => setSelectedBranchId(Number(e.target.value))}
              className="bg-transparent text-white outline-none font-bold min-w-[120px]"
            >
              <option value={0} disabled>Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleEnterBranch}
            className="bg-[#ec4899] hover:bg-pink-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg hover:translate-y-[-1px]"
          >
            <span>Enter Branch</span>
            <ArrowRight size={16} />
          </button>
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#4edea3] animate-pulse"></div>
            <span className="text-[#4edea3] font-bold text-sm">System Live</span>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={64} /></div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Today's Revenue</p>
          <h3 className="text-4xl font-black text-[#4edea3]">${totalRevenue.toFixed(2)}</h3>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><TrendingUp size={12} className="text-[#4edea3]" /> +14.5% vs yesterday</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ShoppingBag size={64} /></div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Orders</p>
          <h3 className="text-4xl font-black text-white">{totalOrders}</h3>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><TrendingUp size={12} className="text-[#4edea3]" /> Active orders</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Store size={64} /></div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Active Branches</p>
          <h3 className="text-4xl font-black text-[#fbbf24]">{selectedBranchId ? 1 : brandOverview.length}</h3>
          <p className="text-xs text-slate-500 mt-2">{selectedBranchId ? 'Viewing single branch' : 'All branches online'}</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertCircle size={64} /></div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Avg Order Value</p>
          <h3 className="text-4xl font-black text-[#3b82f6]">
            ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
          </h3>
          <p className="text-xs text-slate-500 mt-2">Current selection</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* 7-Day Trend Chart */}
        <div className="col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">7-Day Revenue Trend (HQ)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4edea3" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4edea3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => '$' + val} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#4edea3', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#4edea3" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Top Sellers (HQ)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#e2e8f0" fontSize={11} width={80} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="qty" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multi-Store Comparison Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl mt-6">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Branch Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                <th className="p-4 font-bold">Branch Name</th>
                <th className="p-4 font-bold">Location</th>
                <th className="p-4 font-bold">Today's Orders</th>
                <th className="p-4 font-bold">Today's Sales</th>
                <th className="p-4 font-bold">Performance</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {brandOverview.map((store) => (
                <tr key={store.store_id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6]"><Store size={14} /></div>
                    {store.store_name}
                  </td>
                  <td className="p-4 text-slate-400">{store.location}</td>
                  <td className="p-4 text-white font-bold">{store.today_orders}</td>
                  <td className="p-4 text-[#4edea3] font-bold">${store.today_sales.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="w-full bg-slate-900 rounded-full h-2 mt-1 overflow-hidden">
                      <div className="bg-[#fbbf24] h-2 rounded-full" style={{ width: `${Math.min(100, (store.today_sales / (totalBrandRevenue || 1)) * 100)}%` }}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
