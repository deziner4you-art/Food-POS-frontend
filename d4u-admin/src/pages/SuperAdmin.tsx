import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, CheckCircle2, Plus, Edit, Trash2 } from 'lucide-react';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function SuperAdmin() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  
  const [activeTab, setActiveTab] = useState<'PACKAGES' | 'MODULES'>('PACKAGES');
  const [pricingList, setPricingList] = useState<any[]>([]);
  const [globalCurrency, setGlobalCurrency] = useState('USD');

  const currencySymbols: Record<string, string> = {
    USD: '$',
    PKR: 'Rs',
    AED: 'AED',
    QR: 'QR',
    SR: 'SR',
    POUND: '£'
  };
  const getSymbol = () => currencySymbols[globalCurrency] || '$';

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    price: 0,
    has_pos: true,
    has_website: false,
    has_customer_app: false,
    has_rider_app: false,
    has_kds: false,
    has_tv_board: false,
    has_warehouse: false,
    has_recipes: false,
    has_marketing: false,
    has_loyalty: false,
    has_accounts: false,
    has_manager_app: false,
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem('d4u_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/saas-package`, {
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
      });
      if (res.ok) setPackages(await res.json());

      const priceRes = await fetch(`${BACKEND_URL}/subscription/pricing/all`, {
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
      });
      if (priceRes.ok) setPricingList(await priceRes.json());
      
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `${BACKEND_URL}/saas-package/${formData.id}` : `${BACKEND_URL}/saas-package`;
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setToast(isEditing ? 'Package Updated Successfully!' : 'Package Created Successfully!');
        setTimeout(() => setToast(''), 3000);
        setShowModal(false);
        fetchPackages();
      } else {
        const err = await res.json().catch(() => ({}));
        customAlert(err.message || `Error saving package (Status: ${res.status})`);
      }
    } catch (e: any) {
      console.error(e);
      customAlert(`Error saving package: ${e.message}`);
    }
    setSaving(false);
  };

  const handleEdit = (pkg: any) => {
    setFormData(pkg);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!(await customConfirm('Are you sure you want to delete this package?'))) return;
    try {
      const res = await fetch(`${BACKEND_URL}/saas-package/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        fetchPackages();
      }
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  const handleUpdateModulePrice = async (id: number, newPrice: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/subscription/pricing/${id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_monthly: newPrice })
      });
      if (res.ok) {
        customSuccess('Price updated');
        setPricingList(prev => prev.map(p => p.id === id ? { ...p, price_monthly: newPrice } : p));
      } else {
        customAlert('Failed to update price');
      }
    } catch (e) {
      console.error(e);
      customAlert('Failed to update price');
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">SuperAdmin / SaaS Setup</h1>
            <p className="text-gray-500">Manage client subscriptions, modules, and architecture</p>
          </div>
        </div>
        {activeTab === 'PACKAGES' && (
          <button 
            onClick={() => {
              setFormData({
                name: '', price: 0, has_pos: true, has_website: false, has_customer_app: false, 
                has_rider_app: false, has_kds: false, has_tv_board: false, has_warehouse: false, 
                has_recipes: false, has_marketing: false, has_loyalty: false, has_accounts: false, has_manager_app: false
              });
              setIsEditing(false);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-purple-200"
          >
            <Plus size={18} /> Add Package
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('PACKAGES')}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'PACKAGES' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          SaaS Packages
        </button>
        <button 
          onClick={() => setActiveTab('MODULES')}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'MODULES' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          A la Carte Module Pricing
        </button>
      </div>

      {toast && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-xl flex items-center gap-2 border border-green-200">
          <CheckCircle2 className="w-5 h-5" />
          {toast}
        </div>
      )}

      {activeTab === 'PACKAGES' ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold">Package Name</th>
                <th className="p-4 font-bold">
                  Price
                  <select 
                    value={globalCurrency} 
                    onChange={e => setGlobalCurrency(e.target.value)}
                    className="ml-2 bg-transparent text-xs font-bold text-purple-600 outline-none cursor-pointer"
                  >
                    <option value="USD">USD</option>
                    <option value="PKR">PKR</option>
                    <option value="AED">AED</option>
                    <option value="QR">QR</option>
                    <option value="SR">SR</option>
                    <option value="POUND">POUND</option>
                  </select>
                </th>
                <th className="p-4 font-bold">Modules Included</th>
                <th className="p-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => {
                const activeCount = [pkg.has_pos, pkg.has_website, pkg.has_customer_app, pkg.has_rider_app, pkg.has_kds, pkg.has_tv_board, pkg.has_warehouse, pkg.has_recipes, pkg.has_marketing, pkg.has_loyalty, pkg.has_accounts, pkg.has_manager_app].filter(Boolean).length;
                return (
                  <tr key={pkg.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{pkg.name}</td>
                    <td className="p-4 font-mono text-purple-600 font-bold">{getSymbol()}{pkg.price}</td>
                    <td className="p-4">
                      <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold">
                        {activeCount} Modules
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-3 items-center">
                      <button onClick={() => handleEdit(pkg)} className="text-gray-400 hover:text-purple-600 transition-colors">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(pkg.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No SaaS packages found. Create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold">Module Name</th>
                <th className="p-4 font-bold">Module Key</th>
                <th className="p-4 font-bold">
                  <select 
                    value={globalCurrency} 
                    onChange={e => setGlobalCurrency(e.target.value)}
                    className="bg-transparent font-bold outline-none cursor-pointer text-gray-500 hover:text-purple-600 uppercase text-xs tracking-wider"
                  >
                    <option value="USD">Currency (USD)</option>
                    <option value="PKR">Currency (PKR)</option>
                    <option value="AED">Currency (AED)</option>
                    <option value="QR">Currency (QR)</option>
                    <option value="SR">Currency (SR)</option>
                    <option value="POUND">Currency (POUND)</option>
                  </select>
                </th>
                <th className="p-4 font-bold text-right">Monthly Price</th>
              </tr>
            </thead>
            <tbody>
              {pricingList.map(item => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-900">{item.module_name}</td>
                  <td className="p-4"><span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-mono">{item.module_key}</span></td>
                  <td className="p-4 text-gray-500 font-bold">{globalCurrency}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-gray-400 font-bold">{getSymbol()}</span>
                      <input 
                        type="number"
                        defaultValue={item.price_monthly}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (val !== item.price_monthly) {
                            handleUpdateModulePrice(item.id, val);
                          }
                        }}
                        className="w-24 p-2 border border-gray-200 rounded text-right font-mono font-bold outline-none focus:border-purple-500"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {pricingList.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No module pricing found in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit SaaS Package' : 'Create SaaS Package'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Package Name *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-colors text-gray-900"
                    placeholder="e.g. Basic Plan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Price ({getSymbol()})</label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-colors text-gray-900"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Active Modules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'has_pos', label: 'POS Terminal' },
                    { key: 'has_kds', label: 'Kitchen Display (KDS)' },
                    { key: 'has_website', label: 'E-commerce Website' },
                    { key: 'has_customer_app', label: 'Customer App' },
                    { key: 'has_rider_app', label: 'Rider App' },
                    { key: 'has_tv_board', label: 'TV Board Signage' },
                    { key: 'has_warehouse', label: 'Warehouse / Supply' },
                    { key: 'has_recipes', label: 'Recipes / Costing' },
                    { key: 'has_marketing', label: 'Marketing / Social' },
                    { key: 'has_loyalty', label: 'Loyalty Rewards' },
                    { key: 'has_accounts', label: 'Accounts' },
                    { key: 'has_manager_app', label: 'Manager / Owner App' },
                    { key: 'has_waiter_terminal', label: 'Waiter Terminal Engine' },
                  ].map(mod => (
                    <label key={mod.key} className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${formData[mod.key] ? 'border-purple-200 bg-purple-50/50' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100'}`}>
                      <input 
                        type="checkbox" 
                        checked={formData[mod.key]}
                        onChange={e => setFormData({ ...formData, [mod.key]: e.target.checked })}
                        className="accent-purple-600 w-4 h-4 rounded"
                      />
                      <span className="text-gray-700 font-medium select-none">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
