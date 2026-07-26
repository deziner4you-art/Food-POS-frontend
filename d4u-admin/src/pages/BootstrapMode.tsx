import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus, Package, Power } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function BootstrapMode({ user, handleLogout }: { user: any, handleLogout: () => void }) {
  const navigate = useNavigate();
  const [activePackages, setActivePackages] = useState(0);

  useEffect(() => {
    apiFetch('/subscription/package')
      .then(res => res.json())
      .then(data => {
        const active = data.filter((p: any) => p.status === 'ACTIVE').length;
        setActivePackages(active);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center px-8">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <ShieldCheck className="text-blue-500" /> D4U ENTERPRISE ERP
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-white font-bold text-sm block">{user?.name}</span>
            <span className="text-slate-400 text-xs">{user?.role}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 bg-slate-800 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors font-bold text-sm flex items-center gap-2"
          >
            <Power size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main Bootstrap Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-slate-800 border border-blue-500/30 rounded-3xl p-10 text-center animate-fade-in shadow-2xl shadow-blue-500/10">
          <div className="w-24 h-24 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-500/30">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-4xl font-black text-white mb-4">Welcome to D4U ERP</h1>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            The system is in <strong>Bootstrap Mode</strong> because no active Brands were found. 
            Create your first Subscription Package and Brand to activate the system.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10 max-w-md mx-auto">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <span className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Active Packages</span>
              <span className="text-2xl font-black text-white">{activePackages}</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <span className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">System Status</span>
              <span className="text-lg font-black text-amber-500 mt-1 block">Bootstrap</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/setup')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-black transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20 w-full sm:w-auto justify-center"
            >
              <Plus size={20} /> Create First Brand
            </button>
            <button
              onClick={() => navigate('/saas')}
              className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              <Package size={20} /> Manage Packages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
