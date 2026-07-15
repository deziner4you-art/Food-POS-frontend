import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Users, DollarSign, ShoppingBag, ArrowUpRight, Database, Download, Upload, Filter, Calendar } from 'lucide-react';
import { db } from './db';
import { customAlert, customSuccess, customConfirm } from './utils/alerts';

const BACKEND_URL = 'http://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost') + ':3001';

export default function AdminDashboard({ currentUser }: { currentUser?: any }) {
  const storeId = currentUser?.store_id || 1;
  const [data, setData] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('today'); // today, yesterday, week, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedCashier, setSelectedCashier] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchShifts();
    fetchUsers();
  }, [storeId]);

  useEffect(() => {
    fetchAnalytics();
    const int = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(int);
  }, [storeId, dateFilter, customStart, customEnd, selectedShift, selectedCashier]);

  const fetchShifts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/reports/shifts?store_id=${storeId}`);
      if (res.ok) setShifts(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/users?store_id=${storeId}`);
      if (res.ok) setCashiers((await res.json()).filter((u: any) => u.role.name === 'Cashier' || u.role.name === 'Manager'));
    } catch (e) { console.error(e); }
  };

  const fetchAnalytics = async () => {
    let query = `?store_id=${storeId}`;
    
    // Date Logic
    const today = new Date();
    if (dateFilter === 'today') {
      query += `&start_date=${today.toISOString().split('T')[0]}`;
    } else if (dateFilter === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      query += `&start_date=${yest.toISOString().split('T')[0]}&end_date=${yest.toISOString().split('T')[0]}`;
    } else if (dateFilter === 'week') {
      const week = new Date(today);
      week.setDate(week.getDate() - 7);
      query += `&start_date=${week.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`;
    } else if (dateFilter === 'custom' && customStart && customEnd) {
      query += `&start_date=${customStart}&end_date=${customEnd}`;
    }

    if (selectedShift) query += `&business_day_id=${selectedShift}`;
    if (selectedCashier) query += `&cashier_id=${selectedCashier}`;

    try {
      const res = await fetch(`${BACKEND_URL}/reports/branch-analytics${query}`);
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleExportBackup = async () => {
    try {
      const kots = await db.kots.toArray();
      const inventory = await db.inventory.toArray();
      const crmCustomers = await db.crmCustomers.toArray();
      const staffLogs = await db.staffLogs.toArray();

      const backupData = {
        timestamp: new Date().toISOString(),
        version: 1,
        data: { kots, inventory, crmCustomers, staffLogs }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `d4u_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      customAlert('Failed to export backup: ' + e.message);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.data) throw new Error('Invalid backup format');
        
        if (await customConfirm('WARNING: This will overwrite all current local data with the backup. Proceed?')) {
          await db.transaction('rw', db.kots, db.inventory, db.crmCustomers, db.staffLogs, async () => {
            if (json.data.kots) { await db.kots.clear(); await db.kots.bulkAdd(json.data.kots); }
            if (json.data.inventory) { await db.inventory.clear(); await db.inventory.bulkAdd(json.data.inventory); }
            if (json.data.crmCustomers) { await db.crmCustomers.clear(); await db.crmCustomers.bulkAdd(json.data.crmCustomers); }
            if (json.data.staffLogs) { await db.staffLogs.clear(); await db.staffLogs.bulkAdd(json.data.staffLogs); }
          });
          customSuccess('Backup restored successfully! Please refresh the page.');
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (err: any) {
        customAlert('Failed to import backup: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 p-8 animate-fade-in relative">
      
      {/* Header & Filters */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-black text-white m-0">Branch Analytics Dashboard</h2>
          <p className="text-slate-400 mt-1 text-sm">Detailed performance & shift tracking for your branch</p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 font-bold text-sm"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="custom">Custom Range</option>
            <option value="all">All Time</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex gap-2">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none text-sm" />
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none text-sm" />
            </div>
          )}

          <select 
            value={selectedShift} 
            onChange={e => setSelectedShift(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 font-bold text-sm"
          >
            <option value="">All Shifts</option>
            {shifts.map(s => (
              <option key={s.id} value={s.id}>Shift #{s.id} ({new Date(s.dayStart).toLocaleDateString()})</option>
            ))}
          </select>

          <select 
            value={selectedCashier} 
            onChange={e => setSelectedCashier(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 font-bold text-sm"
          >
            <option value="">All Cashiers</option>
            {cashiers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!data ? (
        <div className="flex-1 flex justify-center items-center text-slate-500"><TrendingUp className="animate-spin mr-3"/> Loading analytics...</div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-4 hide-scrollbar">
          
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#fbbf24]/10 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#fbbf24]/20 rounded-xl flex items-center justify-center text-[#fbbf24]">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400">Total Sales</p>
                  <h3 className="text-2xl font-black text-white">Rs. {data.overview.totalSales.toLocaleString()}</h3>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-500">{data.overview.totalOrders} total orders</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400">POS Sales</p>
                  <h3 className="text-2xl font-black text-white">Rs. {data.overview.posSales.toLocaleString()}</h3>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-500">{data.overview.posOrders} walk-in/dine-in orders</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#8b5cf6]/20 rounded-xl flex items-center justify-center text-[#8b5cf6]">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400">Online Sales</p>
                  <h3 className="text-2xl font-black text-white">Rs. {data.overview.onlineSales.toLocaleString()}</h3>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-500">{data.overview.onlineOrders} online orders</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#ec4899]/10 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#ec4899]/20 rounded-xl flex items-center justify-center text-[#ec4899]">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400">Discounts Given</p>
                  <h3 className="text-2xl font-black text-white">Rs. {data.overview.totalDiscount.toLocaleString()}</h3>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-500">{data.overview.voidedCount} voided orders</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Cashier Breakdown */}
            <div className="col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Filter className="text-[#4edea3] w-5 h-5" /> Cashier Performance
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-3 font-bold text-slate-400 text-sm">Cashier Name</th>
                      <th className="py-3 font-bold text-slate-400 text-sm">Total Orders</th>
                      <th className="py-3 font-bold text-slate-400 text-sm">Total Sales</th>
                      <th className="py-3 font-bold text-slate-400 text-sm">Discounts Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cashierBreakdown.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-500 italic">No records found for selected filters</td></tr>
                    )}
                    {data.cashierBreakdown.map((row: any) => (
                      <tr key={row.cashier_id} className="border-b border-slate-700/50 hover:bg-slate-800/80 transition-colors">
                        <td className="py-4 font-bold text-white">{row.cashier_name}</td>
                        <td className="py-4 text-slate-300">{row.total_orders}</td>
                        <td className="py-4 font-bold text-[#4edea3]">Rs. {row.total_sales.toLocaleString()}</td>
                        <td className="py-4 text-[#ec4899]">Rs. {row.total_discount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Offline Data Management */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <Database className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-black text-white mb-2">Offline Data Manager</h3>
              <p className="text-sm text-slate-500 mb-6">Create local backups of your offline POS database or restore from a previous file.</p>
              
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={handleExportBackup}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#4edea3]/10 text-[#4edea3] hover:bg-[#4edea3]/20 border border-[#4edea3]/30 rounded-xl font-bold text-sm transition-colors"
                >
                  <Download size={16} /> Export Local Data
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl font-bold text-sm transition-colors"
                >
                  <Upload size={16} /> Import Local Data
                </button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} style={{ display: 'none' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
