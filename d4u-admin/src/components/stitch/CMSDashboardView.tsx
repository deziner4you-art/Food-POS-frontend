// @ts-nocheck
import React from 'react';

import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sliders,
  Plus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface CMSDashboardViewProps {
  analytics: CMSAnalytics;
  recentOrders: Order[];
  products: Product[];
  onNavigateTab: (tab: string) => void;
}

const REVENUE_DATA = [
  { time: '08:00', revenue: 1200, orders: 35 },
  { time: '10:00', revenue: 2800, orders: 72 },
  { time: '12:00', revenue: 6400, orders: 158 },
  { time: '14:00', revenue: 8900, orders: 210 },
  { time: '16:00', revenue: 11200, orders: 285 },
  { time: '18:00', revenue: 15400, orders: 390 },
  { time: '20:00', revenue: 18450, orders: 489 },
];

export const CMSDashboardView: React.FC<CMSDashboardViewProps> = ({
  analytics,
  recentOrders,
  products,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> D4U Website CMS Executive Operations
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">
            CMS Executive Analytics &amp; Control
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time web traffic, promo conversions, POS kitchen sync status &amp; menu performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('hero')}
            className="bg-[#D4AF37] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl gold-glow hover:bg-[#ffe088] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Hero Slide
          </button>
          <button
            onClick={() => onNavigateTab('promotions')}
            className="bg-[#1A1A1D] border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Flame className="w-4 h-4 text-[#D4AF37]" /> Create Campaign
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#16130B] border border-white/10 p-6 rounded-2xl space-y-3 shadow-xl gold-glow-hover">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Today's Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-display">
            ${analytics.totalRevenueToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% vs yesterday
          </div>
        </div>

        <div className="bg-[#16130B] border border-white/10 p-6 rounded-2xl space-y-3 shadow-xl gold-glow-hover">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Total Orders Placed</span>
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-display">
            {analytics.totalOrdersToday} Orders
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12.1% orders growth
          </div>
        </div>

        <div className="bg-[#16130B] border border-white/10 p-6 rounded-2xl space-y-3 shadow-xl gold-glow-hover">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Unique Web Visitors</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-display">
            {analytics.totalVisitorsToday.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 font-semibold">
            Avg Session: 4m 12s
          </div>
        </div>

        <div className="bg-[#16130B] border border-white/10 p-6 rounded-2xl space-y-3 shadow-xl gold-glow-hover">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold">Campaign Conversion</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-display">
            {analytics.conversionRate}%
          </div>
          <div className="text-[11px] text-[#D4AF37] font-semibold">
            Avg Order: ${analytics.avgOrderValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Recharts Revenue & Orders Area Chart */}
      <div className="bg-[#16130B] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-display">
              Intraday Web Revenue &amp; POS Orders Flow
            </h3>
            <p className="text-xs text-gray-400">Synced in real-time with kitchen display terminals</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-full bg-[#D4AF37] inline-block" /> Revenue ($)
            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block ml-3" /> Orders Count
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A1D',
                  borderColor: '#D4AF37',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#D4AF37"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders Feed & Top Performing Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Web Orders (7 cols) */}
        <div className="lg:col-span-7 bg-[#16130B] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white font-display">Recent Web Orders Feed</h3>
            <span className="text-[11px] text-[#D4AF37] font-semibold">Live POS Connection</span>
          </div>

          <div className="space-y-3">
            {recentOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-[#1A1A1D] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2 font-display">
                    Order #{ord.orderNumber}
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      {ord.orderType.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Customer: {ord.customerName} • {ord.items.length} items
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-[#D4AF37] text-sm">
                    ${ord.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-gray-500 text-[10px]">{ord.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Dishes (5 cols) */}
        <div className="lg:col-span-5 bg-[#16130B] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white font-display">Top Selling Dishes</h3>
            <button
              onClick={() => onNavigateTab('menu')}
              className="text-[11px] text-[#D4AF37] hover:underline font-semibold"
            >
              Manage Catalog
            </button>
          </div>

          <div className="space-y-3">
            {products.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-xs bg-[#1A1A1D] p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <div className="font-bold text-white line-clamp-1 font-display">{p.name}</div>
                    <div className="text-[11px] text-[#D4AF37]">${p.price.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400">{p.stockCount} in stock</div>
                  <div className="text-[10px] text-gray-500">⭐ {p.rating.toFixed(1)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

