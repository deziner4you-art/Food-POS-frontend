import React, { useState } from 'react';
import { Activity, Server, Database, Globe, ChevronDown } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';

export default function WorkspaceStatus() {
  const { brands, activeBrandId, selectedBranchId, branches } = useAdminContext();
  const [isOpen, setIsOpen] = useState(false);

  // Derive simple mock statuses for display per requirements
  const isOnline = true; // Later this could be wired to real API health check 
  
  const currentBrand = brands.find(b => b.id === activeBrandId);
  const dropdownOptions = activeBrandId ? currentBrand?.stores || [] : branches;
  const currentBranch = dropdownOptions.find(b => b.id === selectedBranchId);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'} transition-all`}
      >
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
        <span className="font-bold text-sm hidden sm:inline-block">{isOnline ? 'Live Sync' : 'Offline'}</span>
        <ChevronDown size={14} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-fade-in">
            <h4 className="text-white font-bold text-sm mb-4 border-b border-slate-800 pb-2">Workspace Status</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Server size={14} /> API
                </div>
                <span className="text-emerald-400 font-bold text-sm">Connected</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Activity size={14} /> Socket.IO
                </div>
                <span className="text-emerald-400 font-bold text-sm">Connected</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Database size={14} /> Database
                </div>
                <span className="text-emerald-400 font-bold text-sm">Connected</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <div className="text-slate-500 text-xs">Last Sync</div>
                <span className="text-slate-300 text-xs font-medium">Just now</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Globe size={12} /> Environment
                </div>
                <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Production</span>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="text-slate-500 text-xs mb-1">Current Context</div>
                <div className="text-slate-300 text-sm font-medium">
                  {currentBrand?.name || 'All Brands'}
                  {currentBranch && ` > ${currentBranch.name}`}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
