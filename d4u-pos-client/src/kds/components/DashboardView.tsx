import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell
} from 'recharts';
import { 
  Trophy, 
  Clock, 
  Grid3X3, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Activity,
  CalendarDays
} from 'lucide-react';
import type { Order, Ingredient, LogEvent } from '../types';

interface DashboardViewProps {
  orders: Order[];
  ingredients: Ingredient[];
  logs: LogEvent[];
  metrics?: any;
}

export default function DashboardView({
  orders,
  ingredients,
  logs,
  metrics
}: DashboardViewProps) {
  
  // 1. KPI Calculations
  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeOrders = orders.filter(o => o.status === 'preparing' || o.status === 'pending');
  
  const completedOrdersCount = metrics?.readyTodayCount ?? completedOrders.length;
  const activeOrdersCount = metrics?.queue?.total_active ?? activeOrders.length;
  
  const lowStockCount = ingredients.filter(i => i.currentStock <= i.warningThreshold).length;

  // Average Preparation Time calculation
  const totalCompletedPrepTime = completedOrders.reduce((acc, curr) => {
    return acc + curr.timerElapsedSeconds;
  }, 0);
  
  const averagePrepSeconds = metrics?.avgPrepTimeMinutesToday !== undefined 
    ? metrics.avgPrepTimeMinutesToday * 60
    : (completedOrders.length > 0 ? Math.round(totalCompletedPrepTime / completedOrders.length) : 0);
  
  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  // B. Product popularity chart data
  const productTally: { [name: string]: number } = {};

  const hourlyData: { hour: string, orders: number, averageTime: number }[] = [];
  
  // Aggregate orders into hourly buckets
  orders.forEach(o => {
    if (o.startTime) {
      const h = new Date(o.startTime).getHours();
      const hKey = `${h.toString().padStart(2, '0')}:00`;
      const idx = hourlyData.findIndex(hd => hd.hour === hKey);
      if (idx !== -1) {
        hourlyData[idx].orders++;
      } else {
        hourlyData.push({ hour: hKey, orders: 1, averageTime: averagePrepSeconds });
      }
    }
  });

  // B. Product popularity chart data


  // Populate from actual current data
  orders.forEach(order => {
    order.items.forEach(item => {
      if (productTally[item.name] !== undefined) {
        productTally[item.name] += item.quantity;
      } else {
        productTally[item.name] = item.quantity;
      }
    });
  });

  const productData = Object.keys(productTally).map(name => ({
    name: name,
    Volume: productTally[name],
  })).sort((a, b) => b.Volume - a.Volume).slice(0, 5);

  // C. Preparation Target compliance chart data
  const prepEfficiencyData = completedOrders.map((o, idx) => ({
    order: `#${o.id}`,
    'Target Time': Math.round(o.timerTotalSeconds / 60),
    'Actual Time': Number((o.timerElapsedSeconds / 60).toFixed(1)),
  })).slice(-6); // Limit to last 6 orders



  const COLORS = ['#fbbf24', '#4edea3', '#ff3333', '#00a572'];

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#0c1322] select-none text-[#dce2f7]">
      <h2 className="text-3xl font-display font-bold text-[#dce2f7] mb-6 flex items-center gap-2">
        <Activity className="w-8 h-8 text-brand-yellow" />
        <span>Station Performance Analytics</span>
      </h2>

      {/* KPI Display Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-[#d3c5ac] uppercase tracking-wider">
              Completed Tickets
            </p>
            <h3 className="text-3xl font-display font-bold text-[#dce2f7] mt-1.5 tabular-nums">
              {completedOrdersCount}
            </h3>
            <p className="text-[10px] text-brand-green font-mono mt-1 font-bold">● STATION ACTIVE</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center border border-brand-green/20">
            <CheckCircle className="w-6 h-6 text-brand-green" />
          </div>
        </div>

        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-[#d3c5ac] uppercase tracking-wider">
              Avg. Preparation Time
            </p>
            <h3 className="text-3xl font-display font-bold text-[#dce2f7] mt-1.5 tabular-nums">
              {metrics?.avgPrepTimeMins ? `${metrics.avgPrepTimeMins}m 0s` : (completedOrders.length > 0 ? formatSeconds(averagePrepSeconds) : '8m 42s')}
            </h3>
            <p className="text-[10px] text-[#d3c5ac] font-mono mt-1">Within target limits</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-yellow/10 flex items-center justify-center border border-brand-yellow/20">
            <Clock className="w-6 h-6 text-brand-yellow" />
          </div>
        </div>

        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-[#d3c5ac] uppercase tracking-wider">
              Active In-Queue
            </p>
            <h3 className="text-3xl font-display font-bold text-[#dce2f7] mt-1.5 tabular-nums">
              {activeOrders.length}
            </h3>
            <p className="text-[10px] text-brand-yellow font-mono mt-1 font-bold">Preparing ticket lanes</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-yellow/10 flex items-center justify-center border border-brand-gold/20">
            <Grid3X3 className="w-6 h-6 text-brand-yellow" />
          </div>
        </div>

        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-[#d3c5ac] uppercase tracking-wider">
              Critical Stock Alerts
            </p>
            <h3 className={`text-3xl font-display font-bold mt-1.5 tabular-nums ${lowStockCount > 0 ? 'text-brand-red font-black' : 'text-[#dce2f7]'}`}>
              {lowStockCount}
            </h3>
            <p className="text-[10px] mt-1 font-mono">{lowStockCount > 0 ? 'Urgent refill item lists' : 'All stock levels nominal'}</p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
            lowStockCount > 0 
              ? 'bg-brand-red/10 border-brand-red/30 animate-pulse' 
              : 'bg-[#2e3545] border-[#4f4633]/20'
          }`}>
            <AlertTriangle className={lowStockCount > 0 ? 'w-6 h-6 text-brand-red' : 'w-6 h-6 text-[#d3c5ac]'} />
          </div>
        </div>
      </div>

      {/* Graphics Recharts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        
        {/* Hourly Volume Area chart */}
        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl shadow-lg">
          <h4 className="text-sm font-mono font-bold text-[#d3c5ac] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#4f4633]/25 pb-3">
            <TrendingUp className="w-4 h-4 text-brand-green" />
            <span>Hourly Ticket Load Distribution</span>
          </h4>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4edea3" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4edea3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2e3545" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke="#d3c5ac" fontSize={11} strokeWidth={0.5} />
                <YAxis stroke="#d3c5ac" fontSize={11} strokeWidth={0.5} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#191f2f', border: '1px solid #4f4633', borderRadius: '8px' }}
                  labelStyle={{ color: '#dce2f7', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="orders" name="Received Tickets" stroke="#4edea3" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top items volume bar widget */}
        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl shadow-lg">
          <h4 className="text-sm font-mono font-bold text-[#d3c5ac] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#4f4633]/25 pb-3">
            <Trophy className="w-4 h-4 text-brand-yellow" />
            <span>Recipe Volume Distribution</span>
          </h4>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#2e3545" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#d3c5ac" fontSize={11} strokeWidth={0.5} />
                <YAxis stroke="#d3c5ac" fontSize={11} strokeWidth={0.5} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#191f2f', border: '1px solid #4f4633', borderRadius: '8px' }}
                />
                <Bar dataKey="Volume" fill="#fbbf24" radius={[4, 4, 0, 0]}>
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Preparation Target Compliance Double Line/Bar chart */}
        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl shadow-lg lg:col-span-2">
          <h4 className="text-sm font-mono font-bold text-[#d3c5ac] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#4f4633]/25 pb-3">
            <Clock className="w-4 h-4 text-brand-green" />
            <span>Preparation Accuracy vs Target Limit Compliance (Minutes)</span>
          </h4>
          <div className="h-[260px] w-full border border-transparent">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prepEfficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#2e3545" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="order" stroke="#d3c5ac" fontSize={11} strokeWidth={0.5} />
                <YAxis stroke="#d3c5ac" fontSize={11} strokeWidth={0.5} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#191f2f', border: '1px solid #4f4633', borderRadius: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Target Time" fill="#2e3545" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual Time" fill="#4edea3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Terminal Activity Logs Events List */}
      <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl shadow-lg">
        <h4 className="text-sm font-display font-bold text-[#dce2f7] mb-4 flex items-center gap-2 border-b border-[#4f4633]/25 pb-3">
          <CalendarDays className="w-5 h-5 text-brand-yellow" />
          <span>Real-Time Station Operations Log</span>
        </h4>
        
        <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
          <table className="w-full text-left font-mono text-xs text-[#dce2f7]/80">
            <thead className="bg-[#0c1322] text-[#d3c5ac] sticky top-0 py-2">
              <tr>
                <th className="p-3 font-semibold uppercase tracking-wider">Timestamp</th>
                <th className="p-3 font-semibold uppercase tracking-wider">Event Type</th>
                <th className="p-3 font-semibold uppercase tracking-wider">Description Report</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice().reverse().map((log) => {
                let badgeClass = 'text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/20';
                if (log.type === 'order_completed' || log.type === 'inventory_restock') {
                  badgeClass = 'text-brand-green bg-brand-green/10 border border-brand-green/20';
                } else if (log.type === 'emergency_stop' || log.type === 'inventory_low') {
                  badgeClass = 'text-brand-red bg-brand-red/10 border border-brand-red/20';
                }

                return (
                  <tr key={log.id} className="border-b border-[#4f4633]/15 hover:bg-[#232a3a]/40">
                    <td className="p-3 tabular-nums text-brand-yellow">{log.timestamp}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeClass}`}>
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-[#dce2f7] select-all font-sans">{log.message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
