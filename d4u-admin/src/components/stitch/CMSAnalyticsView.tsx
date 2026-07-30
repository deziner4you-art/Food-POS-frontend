// @ts-nocheck
import React from 'react';

import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  DollarSign,
  Users,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface CMSAnalyticsViewProps {
  analytics: CMSAnalytics;
}

const WEEKLY_DATA = [
  { day: 'Mon', revenue: 11200, orders: 320 },
  { day: 'Tue', revenue: 13400, orders: 390 },
  { day: 'Wed', revenue: 12800, orders: 375 },
  { day: 'Thu', revenue: 16500, orders: 460 },
  { day: 'Fri', revenue: 22400, orders: 620 },
  { day: 'Sat', revenue: 28900, orders: 810 },
  { day: 'Sun', revenue: 25100, orders: 740 },
];

const CATEGORY_SHARE = [
  { name: 'Golden Broast', value: 35, color: '#D4AF37' },
  { name: 'Desi Karahi & BBQ', value: 30, color: '#f59e0b' },
  { name: 'Wagyu Burgers', value: 20, color: '#3b82f6' },
  { name: 'Woodfired Pizza', value: 15, color: '#10b981' },
];

export const CMSAnalyticsView: React.FC<CMSAnalyticsViewProps> = ({ analytics }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-extrabold text-white font-display">
          Website &amp; Campaign Performance Analytics
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Deep-dive telemetry into marketing ROI, category sales share, average order value &amp; customer retention.
        </p>
      </div>

      {/* 2 Big Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Revenue Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#16130B] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#D4AF37]" /> 7-Day Revenue Comparison ($)
            </h3>
            <span className="text-xs text-emerald-400 font-bold">+24.5% vs Last Week</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_DATA}>
                <XAxis dataKey="day" stroke="#666" fontSize={11} />
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
                <Bar dataKey="revenue" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-[#16130B] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#D4AF37]" /> Sales Share By Menu Category
            </h3>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_SHARE}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                >
                  {CATEGORY_SHARE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1D',
                    borderColor: '#D4AF37',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            {CATEGORY_SHARE.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-gray-300">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

