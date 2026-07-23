import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../context/AdminContext';
import { Trash2, RotateCcw, Store, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customAlert, customSuccess } from '../utils/alerts';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function RecycleBin() {
  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}` });

  const navigate = useNavigate();
  const { } = useAdminContext();
  const [deletedStores, setDeletedStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchDeletedStores = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/stores/recycle-bin`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}` }
      });
      if (res.ok) {
        setDeletedStores(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedStores();
  }, []);

  const toggleStoreSelection = (storeId: number) => {
    setSelectedStoreIds(prev => 
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const handleRestore = async () => {
    if (selectedStoreIds.length === 0) return;
    setIsRestoring(true);
    
    try {
      const res = await fetch(`${BACKEND_URL}/stores/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}`
        },
        body: JSON.stringify({ storeIds: selectedStoreIds })
      });
      
      if (res.ok) {
        customSuccess(`Successfully restored ${selectedStoreIds.length} branches.`);
        setSelectedStoreIds([]);
        fetchDeletedStores();
        // Brands fetch not available here directly; typically refreshed in Context or App // Update global context so they reappear
      } else {
        customAlert('Failed to restore branches.');
      }
    } catch (e) {
      customAlert('Network error.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center animate-fade-in font-sans">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <button 
              onClick={() => navigate('/admin/')}
              className="text-slate-500 hover:text-white font-bold flex items-center gap-2 mb-4 transition-colors"
            >
              <ArrowLeft size={18} /> Back to HQ
            </button>
            <h1 className="text-4xl font-black text-white flex items-center gap-3">
              <Trash2 className="text-slate-500" size={36} /> Recycle Bin
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Restore deleted branches</p>
          </div>
          
          <button 
            onClick={handleRestore}
            disabled={selectedStoreIds.length === 0 || isRestoring}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <RotateCcw size={20} /> {isRestoring ? 'Restoring...' : `Restore Selected (${selectedStoreIds.length})`}
          </button>
        </div>

        {/* Deleted Stores List */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-bold">Loading deleted branches...</div>
          ) : deletedStores.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <Trash2 size={64} className="text-slate-700 mb-6" />
              <h2 className="text-2xl font-black text-white mb-2">Recycle Bin is Empty</h2>
              <p className="text-slate-500">No branches have been deleted recently.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 pl-6 w-16">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 accent-emerald-500"
                      checked={selectedStoreIds.length === deletedStores.length && deletedStores.length > 0}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedStoreIds(deletedStores.map(s => s.id));
                        } else {
                          setSelectedStoreIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-4 font-bold">Branch Name</th>
                  <th className="p-4 font-bold">Brand</th>
                  <th className="p-4 font-bold">Deleted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {deletedStores.map(store => {
                  const isSelected = selectedStoreIds.includes(store.id);
                  return (
                    <tr 
                      key={store.id} 
                      onClick={() => toggleStoreSelection(store.id)}
                      className={`hover:bg-slate-700/30 transition-colors cursor-pointer ${isSelected ? 'bg-emerald-500/5' : ''}`}
                    >
                      <td className="p-4 pl-6">
                        <input 
                          type="checkbox"
                          className="w-5 h-5 accent-emerald-500 pointer-events-none"
                          checked={isSelected}
                          readOnly
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                            <Store size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white">{store.name}</p>
                            <p className="text-xs text-slate-500">{store.location || 'No location'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        {store.brand?.name || 'Unknown Brand'}
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {new Date(store.deletedAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
