import React, { useState, useEffect } from 'react';
import { Store, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';

const BACKEND_URL = 'http://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost') + ':3001';

export default function StoreManager() {
  const [stores, setStores] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: '', location: '', is_online: true });
  const [isEditing, setIsEditing] = useState(false);

  const fetchStores = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/stores`);
      if (res.ok) setStores(await res.json());
    } catch (e) {
      console.error('Failed to fetch stores', e);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `${BACKEND_URL}/stores/${formData.id}` : `${BACKEND_URL}/stores`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, brand_id: 1 })
      });
      if (res.ok) {
        setShowModal(false);
        fetchStores();
      }
    } catch (e) {
      console.error('Submit error', e);
    }
  };

  const handleEdit = (store: any) => {
    setFormData({ id: store.id, name: store.name, location: store.location || '', is_online: store.is_online });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!(await customConfirm('Are you sure you want to delete this store?'))) return;
    try {
      await fetch(`${BACKEND_URL}/stores/${id}`, { method: 'DELETE' });
      fetchStores();
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  const toggleStatus = async (store: any) => {
    try {
      await fetch(`${BACKEND_URL}/stores/${store.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_online: !store.is_online })
      });
      fetchStores();
    } catch (e) {
      console.error('Toggle error', e);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Store className="text-blue-400" /> Store Branches
        </h3>
        <button 
          onClick={() => { setFormData({ id: 0, name: '', location: '', is_online: true }); setIsEditing(false); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Plus size={18} /> Add Branch
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/50 text-slate-400">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Location</th>
              <th className="p-4">Online Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map(store => (
              <tr key={store.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                <td className="p-4 font-mono">{store.id}</td>
                <td className="p-4 font-bold text-white">{store.name}</td>
                <td className="p-4">{store.location || 'N/A'}</td>
                <td className="p-4">
                  <button 
                    onClick={() => toggleStatus(store)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${store.is_online ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {store.is_online ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {store.is_online ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => handleEdit(store)} className="text-slate-400 hover:text-white transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(store.id)} className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No stores found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-4">{isEditing ? 'Edit Store' : 'Add New Store'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Store Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. DHA Phase 6"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Location / Address</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Street 123..."
                />
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={formData.is_online}
                  onChange={e => setFormData({...formData, is_online: e.target.checked})}
                  className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-blue-500"
                />
                <label className="text-sm font-bold text-slate-300">Accept Online Orders</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-lg font-bold text-slate-400 bg-slate-900 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
