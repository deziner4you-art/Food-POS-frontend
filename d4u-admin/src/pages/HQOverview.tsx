import React, { useState } from 'react';
import { useAdminContext } from '../context/AdminContext';
import { Building2, Store, Plus, ChevronRight, CheckCircle2, Trash2, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function HQOverview() {
  const { brands, setSelectedBranchId, setIsBranchEntered } = useAdminContext();
  const navigate = useNavigate();
  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null);

  // Delete states
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, type: 'brand'|'store', id: number, name: string} | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Recycle Bin Auth State
  const [recycleAuthOpen, setRecycleAuthOpen] = useState(false);
  const [recyclePin, setRecyclePin] = useState('');
  const [recycleError, setRecycleError] = useState('');

  const storedUser = localStorage.getItem('d4u_admin_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isSuperAdmin = user?.role === 'Super Admin';

  const handleEnterStore = (storeId: number) => {
    setSelectedBranchId(storeId);
    setIsBranchEntered(true);
  };

  const toggleBrand = (brandId: number, storeCount: number, firstStoreId: number) => {
    if (storeCount === 1) {
      // Auto-enter if only 1 store
      handleEnterStore(firstStoreId);
    } else {
      setExpandedBrandId(prev => prev === brandId ? null : brandId);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal || !deletePassword) return;
    setIsDeleting(true);
    setDeleteError('');

    const token = localStorage.getItem('d4u_admin_token');
    const endpoint = deleteModal.type === 'brand' ? '/stores/bulk-delete-brands' : '/stores/bulk-delete';
    const payload = deleteModal.type === 'brand' 
      ? { brandIds: [deleteModal.id], password: deletePassword }
      : { storeIds: [deleteModal.id], password: deletePassword };

    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete');
      }
      
      // Success, reload page
      window.location.reload();
    } catch (e: any) {
      setDeleteError(e.message);
      setIsDeleting(false);
    }
  };

  const handleRecycleBinAccess = () => {
    if (recyclePin === '1234') {
      navigate('/recycle-bin');
    } else {
      setRecycleError('Invalid Master PIN');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center animate-fade-in">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-white">HQ Overview</h1>
            <p className="text-slate-400 mt-2 text-lg">Select a brand or branch to manage</p>
          </div>
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <button 
                onClick={() => setRecycleAuthOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                title="Recycle Bin"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={() => navigate('/setup')}
              className="bg-[#ec4899] hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all hover:scale-105"
            >
              <Plus size={20} /> Add New Branch / Brand
            </button>
          </div>
        </div>

        {/* Brands List */}
        <div className="space-y-6">
          {brands.length === 0 && (
            <div className="bg-slate-800 border border-slate-700 p-10 rounded-2xl text-center">
              <Building2 size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Brands Found</h3>
              <p className="text-slate-400">Click the button above to create your first business.</p>
            </div>
          )}

          {brands.map(brand => {
            const isExpanded = expandedBrandId === brand.id;
            const hasMultipleStores = brand.stores.length > 1;

            return (
              <div key={brand.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl transition-all">
                {/* Brand Header */}
                <div 
                  onClick={() => toggleBrand(brand.id, brand.stores.length, brand.stores[0]?.id)}
                  className={`p-6 flex items-center justify-between cursor-pointer hover:bg-slate-700/50 transition-colors ${isExpanded ? 'border-b border-slate-700 bg-slate-800' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">{brand.name}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Store size={14} /> {brand.stores.length} Branch{brand.stores.length !== 1 ? 'es' : ''}
                        </span>
                        {brand.is_chain_store && (
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/20">
                            Chain Store
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {hasMultipleStores && (
                      <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight size={24} />
                      </div>
                    )}
                    {!hasMultipleStores && brand.stores.length === 1 && (
                      <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg pointer-events-none">
                        Enter Dashboard
                      </button>
                    )}
                    {brand.stores.length === 0 && (
                      <span className="text-slate-500 text-sm italic">No stores yet</span>
                    )}
                    {isSuperAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'brand', id: brand.id, name: brand.name || 'Unknown Brand' }); }}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Brand"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stores List (Expanded) */}
                {isExpanded && hasMultipleStores && (
                  <div className="bg-slate-900/50 p-4">
                    <div className="flex flex-col gap-2">
                      {brand.stores.map(store => (
                        <div 
                          key={store.id} 
                          className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between group transition-all hover:bg-slate-700/30"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
                              <Store size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{store.name}</h3>
                              <p className="text-sm text-slate-400">{store.location || 'No location set'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEnterStore(store.id); }}
                              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg"
                            >
                              Enter Dashboard
                            </button>
                            {isSuperAdmin && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'store', id: store.id, name: store.name }); }}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Delete Branch"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Trash2 className="text-red-400" /> Delete {deleteModal.type === 'brand' ? 'Brand' : 'Branch'}
              </h3>
              <button onClick={() => { setDeleteModal(null); setDeleteError(''); setDeletePassword(''); }} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-slate-300 mb-6 text-sm">
              Are you sure you want to delete <strong className="text-white text-base">{deleteModal.name}</strong>? 
            </p>

            <form onSubmit={e => { e.preventDefault(); handleDeleteConfirm(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Super Admin Password / PIN</label>
                <input 
                  type="password" 
                  autoFocus
                  required
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Enter your PIN to confirm"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none"
                />
              </div>

              {deleteError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                  <AlertCircle size={16} /> {deleteError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => { setDeleteModal(null); setDeleteError(''); setDeletePassword(''); }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isDeleting || !deletePassword}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recycle Bin Auth Modal */}
      {recycleAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Trash2 className="text-emerald-400" /> Access Recycle Bin
              </h3>
              <button onClick={() => { setRecycleAuthOpen(false); setRecycleError(''); setRecyclePin(''); }} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-slate-300 mb-6 text-sm">
              Please enter the Master PIN to access the Recycle Bin.
            </p>

            <form onSubmit={e => { e.preventDefault(); handleRecycleBinAccess(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Master PIN</label>
                <input 
                  type="password" 
                  autoFocus
                  required
                  value={recyclePin}
                  onChange={e => setRecyclePin(e.target.value)}
                  placeholder="Enter Master PIN"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none tracking-widest"
                />
              </div>

              {recycleError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                  <AlertCircle size={16} /> {recycleError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => { setRecycleAuthOpen(false); setRecycleError(''); setRecyclePin(''); }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!recyclePin}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
