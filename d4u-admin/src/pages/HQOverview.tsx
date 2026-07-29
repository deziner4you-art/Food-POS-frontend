import React, { useState } from 'react';
import { useAdminContext } from '../context/AdminContext';
import { Building2, Store, Plus, ChevronRight, CheckCircle2, Trash2, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function HQOverview() {
  const { brands, setSelectedBranchId, setIsBranchEntered } = useAdminContext();
  const navigate = useNavigate();
  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null);

  // Delete states
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, type: 'brand'|'store', id: number, name: string, storeCount?: number} | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Recycle Bin Auth State
  const [recycleAuthOpen, setRecycleAuthOpen] = useState(false);
  const [recyclePin, setRecyclePin] = useState('');
  const [recycleError, setRecycleError] = useState('');

  // Subscription Modal State
  const [subModal, setSubModal] = useState<{isOpen: boolean, type: 'RENEW', brandId: number, subId: number, brandName: string, monthlyRental: number, currency: string} | null>(null);
  const [subAmount, setSubAmount] = useState<number>(0);
  const [subMethod, setSubMethod] = useState('BANK_TRANSFER');
  const [subRef, setSubRef] = useState('');
  const [subLoading, setSubLoading] = useState(false);

  const storedUser = localStorage.getItem('d4u_admin_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isSuperAdmin = user?.role === 'Super Admin';

  const handleEnterStore = (storeId: number) => {
    setSelectedBranchId(storeId);
    setIsBranchEntered(true);
  };

  const toggleBrand = (brandId: number) => {
    setExpandedBrandId(prev => prev === brandId ? null : brandId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal || !deletePassword) return;
    setIsDeleting(true);
    setDeleteError('');

    
    const endpoint = deleteModal.type === 'brand' ? '/stores/bulk-delete-brands' : '/stores/bulk-delete';
    const payload = deleteModal.type === 'brand' 
      ? { brandIds: [deleteModal.id], password: deletePassword, reason: deleteReason }
      : { storeIds: [deleteModal.id], password: deletePassword, reason: deleteReason };

    try {
      const res = await apiFetch(endpoint, {
        method: 'POST',
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
    if (recyclePin === 'MASTER_2026') {
      sessionStorage.setItem('d4u_master_key', recyclePin);
      navigate('/recycle-bin');
    } else {
      setRecycleError('Invalid Master PIN');
    }
  };

  const handleSubAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subModal) return;
    setSubLoading(true);
    
    try {
      if (subModal.type === 'RENEW') {
        const res = await apiFetch(`/subscription/${subModal.subId}/renew`, {
          method: 'POST',
          body: JSON.stringify({ amount_paid: subAmount, payment_method: subMethod, reference_number: subRef })
        });
        if (res.ok) window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
    setSubLoading(false);
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
                  onClick={() => toggleBrand(brand.id)}
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
                        {(brand as any).subscription && (
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${(brand as any).subscription.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {(brand as any).subscription.package?.name || 'SaaS'} • {(brand as any).subscription.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {brand.stores.length > 0 && (
                      <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight size={24} />
                      </div>
                    )}
                    {brand.stores.length === 0 && (
                      <span className="text-slate-500 text-sm italic">No stores yet</span>
                    )}
                    {isSuperAdmin && (
                      <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'brand', id: brand.id, name: brand.name, storeCount: brand.stores.length }); }}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Brand"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stores List (Expanded) */}
                {isExpanded && brand.stores.length > 0 && (
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
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{store.name}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                  (store as any).status === 'SUSPENDED' 
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                    : (store as any).status === 'MAINTENANCE' 
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                  {(store as any).status || ((store as any).is_online ? 'ACTIVE' : 'SUSPENDED')}
                                </span>
                              </div>
                              <p className="text-sm text-slate-400">{store.location || 'No location set'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEnterStore(store.id); }}
                              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg ${
                                (store as any).status === 'SUSPENDED'
                                  ? 'bg-slate-700 text-amber-300 hover:bg-slate-600'
                                  : (store as any).status === 'MAINTENANCE'
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                              }`}
                            >
                              {(store as any).status === 'SUSPENDED' ? 'Read-Only Dashboard' : (store as any).status === 'MAINTENANCE' ? 'Maintenance Mode' : 'Enter Dashboard'}
                            </button>

                            {isSuperAdmin && (
                              <>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const nextStatus = (store as any).status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
                                    await apiFetch(`/stores/${store.id}/lifecycle`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: nextStatus, reason: `Admin toggled to ${nextStatus}` })
                                    });
                                    window.location.reload();
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    (store as any).status === 'SUSPENDED'
                                      ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                                      : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                                  }`}
                                  title={(store as any).status === 'SUSPENDED' ? "Reactivate Branch" : "Suspend Branch"}
                                >
                                  <AlertCircle size={18} />
                                </button>
                                
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const nextStatus = (store as any).status === 'MAINTENANCE' ? 'ACTIVE' : 'MAINTENANCE';
                                    await apiFetch(`/stores/${store.id}/lifecycle`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: nextStatus, reason: `Admin toggled to ${nextStatus}` })
                                    });
                                    window.location.reload();
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    (store as any).status === 'MAINTENANCE'
                                      ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                                      : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                                  }`}
                                  title={(store as any).status === 'MAINTENANCE' ? "Exit Maintenance" : "Enter Maintenance"}
                                >
                                  <Store size={18} />
                                </button>

                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'store', id: store.id, name: store.name }); }}
                                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Recycle Branch"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
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
            
            <p className="text-slate-300 mb-4 text-sm">
              Are you sure you want to delete <strong className="text-white text-base">{deleteModal.name}</strong>? 
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <h4 className="text-amber-400 font-bold text-sm mb-2">Dependency Check</h4>
              <ul className="text-slate-300 text-sm space-y-1 mb-3">
                {deleteModal.type === 'brand' && <li>Contains <strong>{deleteModal.storeCount} Stores</strong></li>}
                <li>Contains <strong>{deleteModal.type === 'brand' ? '235' : '15'} Employees</strong> (Mock)</li>
                <li>Contains <strong>{deleteModal.type === 'brand' ? '15,200' : '1,200'} Orders</strong> (Mock)</li>
                <li>Contains <strong>{deleteModal.type === 'brand' ? '87' : '45'} Products</strong> (Mock)</li>
              </ul>
              <p className="text-amber-400/80 text-xs italic">
                This {deleteModal.type === 'brand' ? 'Brand' : 'Branch'} will be moved to the Recycle Bin. Nothing will be permanently deleted.
              </p>
            </div>

            <form onSubmit={e => { e.preventDefault(); handleDeleteConfirm(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Reason for Deletion</label>
                <input 
                  type="text" 
                  required
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="e.g. Duplicate Company"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Super Admin Password / PIN</label>
                <input 
                  type="password" 
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
                  onClick={() => { setDeleteModal(null); setDeleteError(''); setDeletePassword(''); setDeleteReason(''); }}
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

      {/* Subscription Modal */}
      {subModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                Renew Subscription
              </h3>
              <button onClick={() => setSubModal(null)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubAction}>
                  <div className="mb-4">
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Amount Paid ({subModal.currency})</label>
                    <input 
                      type="number" 
                      value={subAmount}
                      onChange={(e) => setSubAmount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Payment Method</label>
                    <select 
                      value={subMethod}
                      onChange={(e) => setSubMethod(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                    </select>
                  </div>
                  <div className="mb-6">
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Reference Number (Optional)</label>
                    <input 
                      type="text" 
                      value={subRef}
                      onChange={(e) => setSubRef(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
                      placeholder="e.g. TXN12345"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={subLoading}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-colors disabled:opacity-50"
                  >
                    {subLoading ? 'Processing...' : 'Confirm Payment & Renew'}
                  </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
