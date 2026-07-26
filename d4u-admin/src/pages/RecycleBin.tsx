import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Store, ArrowLeft, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customAlert, customSuccess } from '../utils/alerts';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function RecycleBin() {
  const navigate = useNavigate();
  const [deletedBrands, setDeletedBrands] = useState<any[]>([]);
  const [deletedStores, setDeletedStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [activeTab, setActiveTab] = useState<'brands' | 'stores'>('brands');

  const masterKey = sessionStorage.getItem('d4u_master_key');

  const getHeaders = () => ({ 
    'Content-Type': 'application/json', 
    'x-master-key': masterKey || ''
  });

  useEffect(() => {
    if (!masterKey) {
      navigate('/');
      return;
    }
    fetchArchives();
  }, [masterKey]);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const [brandsRes, storesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/stores/recycle-bin/brands`, { headers: getHeaders() }),
        fetch(`${BACKEND_URL}/stores/recycle-bin/stores`, { headers: getHeaders() })
      ]);
      
      if (brandsRes.ok) setDeletedBrands(await brandsRes.json());
      if (storesRes.ok) setDeletedStores(await storesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: number, type: 'brand' | 'store') => {
    if (type === 'brand') {
      setSelectedBrandIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedStoreIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const handleRestore = async () => {
    const isBrand = activeTab === 'brands';
    const selectedIds = isBrand ? selectedBrandIds : selectedStoreIds;
    if (selectedIds.length === 0) return;
    
    setIsRestoring(true);
    const endpoint = isBrand ? '/stores/recycle-bin/restore-brands' : '/stores/recycle-bin/restore-stores';
    const payload = isBrand ? { brandIds: selectedIds } : { storeIds: selectedIds };

    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        customSuccess(`Successfully restored ${selectedIds.length} ${isBrand ? 'Brands' : 'Branches'}.`);
        if (isBrand) setSelectedBrandIds([]);
        else setSelectedStoreIds([]);
        fetchArchives();
      } else {
        customAlert(`Failed to restore ${isBrand ? 'brands' : 'branches'}.`);
      }
    } catch (e) {
      customAlert('Network error.');
    } finally {
      setIsRestoring(false);
    }
  };

  const hasSelection = activeTab === 'brands' ? selectedBrandIds.length > 0 : selectedStoreIds.length > 0;
  const currentList = activeTab === 'brands' ? deletedBrands : deletedStores;

  return (
    <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center animate-fade-in font-sans">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <button 
              onClick={() => {
                sessionStorage.removeItem('d4u_master_key');
                navigate('/saas'); // Or '/' depending on your route setup
              }}
              className="text-slate-500 hover:text-white font-bold flex items-center gap-2 mb-4 transition-colors"
            >
              <ArrowLeft size={18} /> Lock & Exit
            </button>
            <h1 className="text-4xl font-black text-amber-500 flex items-center gap-3">
              <Trash2 size={36} /> Enterprise Recycle Bin
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Master Key Authorized. Permanent deletion is disabled.</p>
          </div>
          
          <button 
            onClick={handleRestore}
            disabled={!hasSelection || isRestoring}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <RotateCcw size={20} /> 
            {isRestoring ? 'Restoring...' : `Restore Selected (${activeTab === 'brands' ? selectedBrandIds.length : selectedStoreIds.length})`}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'brands' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
          >
            <Building2 size={18} /> Brands ({deletedBrands.length})
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'stores' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
          >
            <Store size={18} /> Branches ({deletedStores.length})
          </button>
        </div>

        {/* List */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-bold">Scanning archives...</div>
          ) : currentList.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <Trash2 size={64} className="text-slate-700 mb-6" />
              <h2 className="text-2xl font-black text-white mb-2">Archive Empty</h2>
              <p className="text-slate-500">No {activeTab} are currently in the Recycle Bin.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 pl-6 w-16"></th>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Deleted By</th>
                  <th className="p-4 font-bold">Reason</th>
                  <th className="p-4 font-bold">Deleted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {currentList.map(item => {
                  const isSelected = activeTab === 'brands' ? selectedBrandIds.includes(item.id) : selectedStoreIds.includes(item.id);
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => toggleSelection(item.id, activeTab === 'brands' ? 'brand' : 'store')}
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
                            {activeTab === 'brands' ? <Building2 size={20} /> : <Store size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-white">{item.name}</p>
                            <p className="text-xs text-slate-500">ID: {item.id} {activeTab === 'brands' ? `· Stores: ${item.stores?.length || 0}` : `· Brand ID: ${item.brand_id}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-700 px-2 py-1 rounded text-slate-300 text-sm font-medium">
                          {item.deleted_by || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-amber-400/80 text-sm italic">
                          "{item.deleted_reason || 'No reason provided'}"
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : 'N/A'}
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
