import React from 'react';
import { useAdminContext } from '../../context/AdminContext';
import { Building2, Store, ShieldCheck } from 'lucide-react';

export default function WorkspaceContextPanel({ user }: { user: any }) {
  const { brands, activeBrandId, selectedBranchId, branches } = useAdminContext();
  
  const currentBrand = brands.find(b => b.id === activeBrandId);
  const dropdownOptions = activeBrandId ? currentBrand?.stores || [] : branches;
  const currentBranch = dropdownOptions.find(b => b.id === selectedBranchId);

  return (
    <div className="flex items-center gap-6 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Current Brand</span>
        <div className="flex items-center gap-1.5 text-white font-medium text-sm">
          <Building2 size={14} className="text-slate-400" />
          {currentBrand?.name || 'All Brands'}
        </div>
      </div>
      
      <div className="w-px h-8 bg-slate-700"></div>
      
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Current Branch</span>
        <div className="flex items-center gap-1.5 text-white font-medium text-sm">
          <Store size={14} className="text-slate-400" />
          {currentBranch?.name || 'All Branches'}
        </div>
      </div>
      
      <div className="w-px h-8 bg-slate-700 hidden sm:block"></div>
      
      <div className="flex flex-col hidden sm:flex">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Active Role</span>
        <div className="flex items-center gap-1.5 text-white font-medium text-sm">
          <ShieldCheck size={14} className="text-emerald-400" />
          {user?.role || 'System'}
        </div>
      </div>
    </div>
  );
}
