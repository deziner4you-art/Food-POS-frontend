import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Users, DollarSign, Star, ShoppingBag, ArrowUpRight, Database, Download, Upload } from 'lucide-react';
import { db } from './db';

export default function AdminDashboard({ posSales }: { posSales: number }) {
  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('http://localhost:3001/online-orders');
        if (res.ok) setOnlineOrders(await res.json());
      } catch (e) {}
    };
    fetchOrders();
    const int = setInterval(fetchOrders, 5000);
    return () => clearInterval(int);
  }, []);

  const onlineSales = onlineOrders.filter(o => o.status === 'SETTLED' || o.status === 'PAID').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const onlineCount = onlineOrders.length;
  
  const feedbacks = onlineOrders.filter(o => o.feedback).map(o => ({
    id: o.id,
    customer: o.customer,
    rating: o.feedback.rating,
    comment: o.feedback.comment
  }));
  const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : 'N/A';

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
    } catch (e) {
      alert('Failed to export backup: ' + e);
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
        
        if (window.confirm('WARNING: This will overwrite all current local data with the backup. Proceed?')) {
          await db.transaction('rw', db.kots, db.inventory, db.crmCustomers, db.staffLogs, async () => {
            if (json.data.kots) { await db.kots.clear(); await db.kots.bulkAdd(json.data.kots); }
            if (json.data.inventory) { await db.inventory.clear(); await db.inventory.bulkAdd(json.data.inventory); }
            if (json.data.crmCustomers) { await db.crmCustomers.clear(); await db.crmCustomers.bulkAdd(json.data.crmCustomers); }
            if (json.data.staffLogs) { await db.staffLogs.clear(); await db.staffLogs.bulkAdd(json.data.staffLogs); }
          });
          alert('Backup restored successfully! Please refresh the page.');
          window.location.reload();
        }
      } catch (err) {
        alert('Failed to import backup: ' + err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-8 animate-slide-up h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white m-0">Admin Analytics</h2>
          <p className="text-slate-400 mt-1 text-sm">Real-time business performance & insights</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
          <span className="text-xs font-bold text-slate-300">Live Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#fbbf24]/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#fbbf24]/20 rounded-xl flex items-center justify-center text-[#fbbf24]">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">Total Sales (Today)</p>
              <h3 className="text-2xl font-black text-white">Rs. {(posSales + onlineSales).toLocaleString()}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#4edea3]">
            <ArrowUpRight size={14} /> +12% from yesterday
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#8b5cf6]/20 rounded-xl flex items-center justify-center text-[#8b5cf6]">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">Online Sales</p>
              <h3 className="text-2xl font-black text-white">Rs. {onlineSales.toLocaleString()}</h3>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-500">{onlineCount} total online orders</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">POS Sales</p>
              <h3 className="text-2xl font-black text-white">Rs. {posSales.toLocaleString()}</h3>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-500">Walk-in & Dine-in</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#4edea3]/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#4edea3]/20 rounded-xl flex items-center justify-center text-[#4edea3]">
              <Star size={24} className="fill-[#4edea3]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">Avg Rating</p>
              <h3 className="text-2xl font-black text-white">{avgRating} <span className="text-sm text-slate-500">/ 5.0</span></h3>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-500">Based on {feedbacks.length} reviews</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Star className="text-[#fbbf24] w-5 h-5" /> Recent Feedback
          </h3>
          <div className="space-y-4">
            {feedbacks.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No feedback received yet.</p>
            ) : (
              feedbacks.slice().reverse().slice(0, 5).map((fb, idx) => (
                <div key={idx} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-slate-200">{fb.customer}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= fb.rating ? 'text-[#fbbf24] fill-[#fbbf24]' : 'text-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic">"{fb.comment || 'No comment provided'}"</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <Database className="w-16 h-16 text-slate-700 mb-4" />
          <h3 className="text-lg font-black text-white mb-2">Data Management</h3>
          <p className="text-sm text-slate-500 max-w-xs mb-6">Create local backups of your offline POS database or restore from a previous file.</p>
          
          <div className="flex gap-4 w-full px-4">
            <button 
              onClick={handleExportBackup}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#4edea3]/10 text-[#4edea3] hover:bg-[#4edea3]/20 border border-[#4edea3]/30 rounded-xl font-bold text-sm transition-colors"
            >
              <Download size={16} /> Export Backup
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl font-bold text-sm transition-colors"
            >
              <Upload size={16} /> Import Backup
            </button>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} style={{ display: 'none' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
