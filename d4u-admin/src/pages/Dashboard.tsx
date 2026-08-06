import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Store, AlertCircle, ArrowRight } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { customAlert } from '../utils/alerts';
import { formatCurrency } from '../utils/currency';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function Dashboard() {
  const [brandOverview, setBrandOverview] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { brands, selectedBranchId, activeBrandId } = useAdminContext();

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
    return <div className="flex h-full items-center justify-center text-stitch-muted">Loading Analytics...</div>;
  }

  // Calculate Revenue
  const filteredOverview = selectedBranchId ? brandOverview.filter(b => b.store_id === selectedBranchId) : brandOverview;
  const totalRevenue = filteredOverview.reduce((sum, store) => sum + store.today_sales, 0);
  const totalOrders = filteredOverview.reduce((sum, store) => sum + store.today_orders, 0);

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-stitch-ink">Live Analytics</h2>
          <p className="text-stitch-muted text-sm mt-1">Real-time performance metrics</p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-stitch-panel to-stitch-bg border border-stitch-border p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={64} /></div>
          <p className="text-stitch-muted text-sm font-bold uppercase tracking-wider mb-2">Today's Revenue</p>
          <h3 className="text-4xl font-black text-stitch-success">{formatCurrency(totalRevenue)}</h3>
          <p className="text-xs text-stitch-muted mt-2 flex items-center gap-1"><TrendingUp size={12} className="text-stitch-success" /> +14.5% vs yesterday</p>
        </div>

        <div className="bg-gradient-to-br from-stitch-panel to-stitch-bg border border-stitch-border p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ShoppingBag size={64} /></div>
          <p className="text-stitch-muted text-sm font-bold uppercase tracking-wider mb-2">Total Orders</p>
          <h3 className="text-4xl font-black text-stitch-ink">{totalOrders}</h3>
          <p className="text-xs text-stitch-muted mt-2 flex items-center gap-1"><TrendingUp size={12} className="text-stitch-success" /> Active orders</p>
        </div>

        <div className="bg-gradient-to-br from-stitch-panel to-stitch-bg border border-stitch-border p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Store size={64} /></div>
          <p className="text-stitch-muted text-sm font-bold uppercase tracking-wider mb-2">Active Branches</p>
          <h3 className="text-4xl font-black text-[#fbbf24]">{selectedBranchId ? 1 : brandOverview.length}</h3>
          <p className="text-xs text-stitch-muted mt-2">{selectedBranchId ? 'Viewing single branch' : 'All branches online'}</p>
        </div>

        <div className="bg-gradient-to-br from-stitch-panel to-stitch-bg border border-stitch-border p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertCircle size={64} /></div>
          <p className="text-stitch-muted text-sm font-bold uppercase tracking-wider mb-2">Avg Order Value</p>
          <h3 className="text-4xl font-black text-[#3b82f6]">
            {formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
          </h3>
          <p className="text-xs text-stitch-muted mt-2">Current selection</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* 7-Day Trend Chart */}
        <div className="col-span-2 bg-stitch-card border border-stitch-border rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-stitch-ink mb-6">7-Day Revenue Trend (HQ)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--stitch-success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--stitch-success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stitch-border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--stitch-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--stitch-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => 'Rs. ' + val} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'var(--stitch-panel)', borderColor: 'var(--stitch-border)', borderRadius: '8px', color: 'var(--stitch-ink)' }}
                  itemStyle={{ color: 'var(--stitch-success)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" stroke="var(--stitch-success)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-stitch-card border border-stitch-border rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-stitch-ink mb-6">Top Sellers (HQ)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stitch-border)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--stitch-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--stitch-ink)" fontSize={11} width={80} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  cursor={{fill: 'var(--stitch-surface)'}}
                  contentStyle={{ backgroundColor: 'var(--stitch-panel)', borderColor: 'var(--stitch-border)', borderRadius: '8px', color: 'var(--stitch-ink)' }}
                />
                <Bar dataKey="qty" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multi-Store Comparison Table */}
      <div className="bg-stitch-card border border-stitch-border rounded-2xl overflow-hidden shadow-xl mt-6">
        <div className="p-6 border-b border-stitch-border">
          <h3 className="text-lg font-bold text-stitch-ink">Branch Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stitch-surface text-xs uppercase tracking-wider text-stitch-muted border-b border-stitch-border">
                <th className="p-4 font-bold">Branch Name</th>
                <th className="p-4 font-bold">Location</th>
                <th className="p-4 font-bold">Today's Orders</th>
                <th className="p-4 font-bold">Today's Sales</th>
                <th className="p-4 font-bold">Performance</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {brandOverview.map((store) => (
                <tr key={store.store_id} className="border-b border-stitch-border/50 hover:bg-stitch-surface/60 transition-colors">
                  <td className="p-4 font-bold text-stitch-ink flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6]"><Store size={14} /></div>
                    {store.store_name}
                  </td>
                  <td className="p-4 text-stitch-muted">{store.location}</td>
                  <td className="p-4 text-stitch-ink font-bold">{store.today_orders}</td>
                  <td className="p-4 text-stitch-success font-bold">{formatCurrency(store.today_sales)}</td>
                  <td className="p-4">
                      <div className="w-full bg-stitch-surface rounded-full h-2 mt-1 overflow-hidden">
                        <div className="bg-[#fbbf24] h-2 rounded-full" style={{ width: `${Math.min(100, (store.today_sales / (totalRevenue || 1)) * 100)}%` }}></div>
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
