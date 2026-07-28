import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../../context/AdminContext';
import UnsavedChangesDialog from './UnsavedChangesDialog';

export default function WorkspaceSwitcher({ user }: { user: any }) {
  const { branches, brands, selectedBranchId, setSelectedBranchId, activeBrandId, setActiveBrandId, checkWorkspaceDirty } = useAdminContext();
  
  const [pendingBrandId, setPendingBrandId] = useState<number | null>(activeBrandId);
  const [pendingBranchId, setPendingBranchId] = useState<number | null>(selectedBranchId);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isSuperAdmin = user?.role === 'Super Admin';
  const isBrandAdmin = user?.role === 'Business Owner' || user?.role === 'Business Admin' || user?.role === 'HeadOffice';
  const isBranchManager = !isSuperAdmin && !isBrandAdmin;

  useEffect(() => {
    setPendingBrandId(activeBrandId);
    setPendingBranchId(selectedBranchId);
  }, [activeBrandId, selectedBranchId]);

  if (isBranchManager) {
    return null; // Branch Manager has context fixed
  }

  const hasChanges = pendingBrandId !== activeBrandId || pendingBranchId !== selectedBranchId;

  const performSwitch = () => {
    setIsLoading(true);
    // Simulate complex Enterprise teardown/setup
    setTimeout(() => {
      setActiveBrandId(pendingBrandId);
      setSelectedBranchId(pendingBranchId || 0);
      setIsLoading(false);
      // We don't force page reload with window.location to preserve SPA state unless necessary,
      // but react-router + Context update will trigger a cascade re-render of all modules.
    }, 600);
  };

  const handleEnterClick = () => {
    if (!hasChanges) return;
    
    if (checkWorkspaceDirty()) {
      setIsDialogOpen(true);
    } else {
      performSwitch();
    }
  };

  const confirmSwitch = () => {
    setIsDialogOpen(false);
    performSwitch();
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-pink-500 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-black text-white mb-2">Switching Workspace...</h2>
          <div className="flex items-center gap-3 text-slate-400">
            <span>{brands.find(b => b.id === pendingBrandId)?.name || 'All Brands'}</span>
            <span>→</span>
            <span>{
              (pendingBrandId ? brands.find(b => b.id === pendingBrandId)?.stores || [] : branches).find(s => s.id === pendingBranchId)?.name || 'All Branches'
            }</span>
          </div>
          <p className="text-slate-500 text-sm mt-8 animate-pulse">Loading modules & refreshing connections...</p>
        </div>
      )}

      <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
        {isSuperAdmin && (
          <>
            <span className="text-slate-400 font-bold text-sm hidden sm:inline-block">Brand:</span>
            <select 
              value={pendingBrandId || 0} 
              onChange={e => {
                const newBrandId = Number(e.target.value);
                setPendingBrandId(newBrandId === 0 ? null : newBrandId);
                setPendingBranchId(0);
              }}
              className="bg-slate-800 text-white outline-none font-bold min-w-[120px]"
            >
              <option value={0} className="bg-slate-800 text-white">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-800 text-white">{b.name}</option>
              ))}
            </select>
            <div className="w-px h-6 bg-slate-700 mx-2"></div>
          </>
        )}
        
        <span className="text-slate-400 font-bold text-sm hidden sm:inline-block">Branch:</span>
        <select 
          value={pendingBranchId || 0} 
          onChange={e => setPendingBranchId(Number(e.target.value))}
          className="bg-slate-800 text-white outline-none font-bold min-w-[120px]"
        >
          <option value={0} className="bg-slate-800 text-white">All Branches</option>
          {(pendingBrandId ? brands.find(b => b.id === pendingBrandId)?.stores || [] : branches).map(b => (
            <option key={b.id} value={b.id} className="bg-slate-800 text-white">{b.name}</option>
          ))}
        </select>

        <button 
          onClick={handleEnterClick}
          disabled={!hasChanges}
          className={`ml-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
            hasChanges 
              ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-lg cursor-pointer' 
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Enter
        </button>
      </div>

      <UnsavedChangesDialog 
        isOpen={isDialogOpen} 
        onCancel={() => setIsDialogOpen(false)} 
        onConfirm={confirmSwitch} 
      />
    </>
  );
}
