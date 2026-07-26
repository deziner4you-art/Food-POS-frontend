import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, CheckCircle2, Plus, Archive, Pencil } from 'lucide-react';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';
import { apiFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function SuperAdmin() {
  const navigate = useNavigate();
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
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    currency: 'USD',
    monthly_rental: 0,
    billing_cycle: 'MONTHLY',
    selected_modules: []
  });
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const fetchPackages = async () => {
    try {
      const res = await apiFetch('/subscription/package');
      if (res.ok) {
        const data = await res.json();
        setPackages(data.filter((p: any) => p.status !== 'ARCHIVED'));
      }

      const priceRes = await apiFetch(`/subscription/pricing?currency=${globalCurrency}`);
      if (priceRes.ok) setPricingList(await priceRes.json());
      
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [globalCurrency]);

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        currency: formData.currency,
        monthly_rental: formData.monthly_rental,
        billing_cycle: formData.billing_cycle,
        modules: formData.selected_modules.map((key: string) => {
          const m = pricingList.find(p => p.module_key === key);
          return { module_key: key, price: m ? m.price_monthly : 0 };
        })
      };

      const isEdit = editingPackageId !== null;
      const url = isEdit ? `/subscription/package/${editingPackageId}` : `/subscription/package`;
      const res = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setToast(isEdit ? 'Package Updated Successfully!' : 'Package Created Successfully!');
        setTimeout(() => setToast(''), 3000);
        setShowModal(false);
        setEditingPackageId(null);
        fetchPackages();

        if (sessionStorage.getItem('d4u_return_to_setup') === 'true') {
          sessionStorage.removeItem('d4u_return_to_setup');
          navigate('/setup');
        }
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

  const handleArchive = async (id: number) => {
    if (!(await customConfirm('Are you sure you want to archive this package?'))) return;
    try {
      const res = await apiFetch(`/subscription/package/${id}/archive`, { 
        method: 'PATCH'
      });
      if (res.ok) {
        customSuccess('Package archived');
        fetchPackages();
      } else {
        const err = await res.json().catch(() => ({}));
        customAlert(err.message || 'Failed to archive package');
      }
    } catch (e) {
      console.error('Archive error', e);
    }
  };

  const handleUpdateModulePrice = async (id: number, newPrice: number) => {
    try {
      const res = await apiFetch(`/subscription/pricing/${id}`, {
        method: 'PUT',
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

  const toggleModuleSelection = (key: string) => {
    setFormData((prev: any) => ({
      ...prev,
      selected_modules: prev.selected_modules.includes(key)
        ? prev.selected_modules.filter((k: string) => k !== key)
        : [...prev.selected_modules, key]
    }));
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
        {activeTab === 'MODULES' && (
          <button 
            onClick={() => {
              setEditingPackageId(null);
              setFormData({
                name: '', description: '', currency: globalCurrency, monthly_rental: 0, billing_cycle: 'MONTHLY', selected_modules: []
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-purple-200"
          >
            <Plus size={18} /> Create Package from Modules
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
                <th className="p-4 font-bold">Billing Cycle</th>
                <th className="p-4 font-bold">Rental Amount</th>
                <th className="p-4 font-bold">Modules Included</th>
                <th className="p-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr key={pkg.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-900">
                    {pkg.name}
                    <div className="text-xs text-gray-400 font-normal mt-1">{pkg.description}</div>
                  </td>
                  <td className="p-4 font-medium text-gray-600">{pkg.billing_cycle}</td>
                  <td className="p-4 font-mono text-purple-600 font-bold">{pkg.currency} {pkg.monthly_rental}</td>
                  <td className="p-4">
                    <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold">
                      {pkg.modules?.length || 0} Modules
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-3 items-center">
                    <button 
                      onClick={() => {
                        setEditingPackageId(pkg.id);
                        setGlobalCurrency(pkg.currency); // Ensure pricing list switches to this currency to show modules correctly
                        setFormData({
                          name: pkg.name,
                          description: pkg.description || '',
                          currency: pkg.currency,
                          monthly_rental: pkg.monthly_rental,
                          billing_cycle: pkg.billing_cycle,
                          selected_modules: pkg.modules?.map((m: any) => m.module_key) || []
                        });
                        setShowModal(true);
                      }}
                      className="text-gray-400 hover:text-blue-500 transition-colors" title="Edit Package"
                    >
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleArchive(pkg.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Archive Package">
                      <Archive size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No active SaaS packages found.</td>
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
              <h3 className="text-xl font-bold text-gray-800">Create SaaS Package</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSavePackage} className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
                  <input 
                    readOnly
                    type="text" 
                    value={formData.currency}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-colors text-gray-900"
                    placeholder="Brief description of the package"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Rental ({getSymbol()})</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.monthly_rental}
                    onChange={e => setFormData({ ...formData, monthly_rental: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-colors text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Billing Cycle</label>
                  <select 
                    value={formData.billing_cycle}
                    onChange={e => setFormData({ ...formData, billing_cycle: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-colors text-gray-900"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Select Modules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pricingList.map(mod => {
                    const isSelected = formData.selected_modules.includes(mod.module_key);
                    return (
                      <label key={mod.module_key} className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${isSelected ? 'border-purple-200 bg-purple-50/50' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100'}`}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleModuleSelection(mod.module_key)}
                          className="accent-purple-600 w-4 h-4 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-gray-700 font-medium select-none block">{mod.module_name}</span>
                          <span className="text-gray-400 text-xs font-mono">{mod.module_key} &bull; {getSymbol()}{mod.price_monthly}</span>
                        </div>
                      </label>
                    );
                  })}
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
                onClick={handleSavePackage}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
