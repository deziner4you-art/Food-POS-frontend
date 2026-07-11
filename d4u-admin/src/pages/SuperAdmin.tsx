import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = 'http://localhost:3001';

export default function SuperAdmin() {
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  
  // Pricing configuration state
  const [currency, setCurrency] = useState('USD');
  const [modulePrices, setModulePrices] = useState<Record<string, number>>({
    has_pos: 20, has_website: 20, has_customer_app: 20, has_rider_app: 20,
    has_kds: 20, has_tv_board: 20, has_warehouse: 20, has_recipes: 20,
    has_marketing: 20, has_loyalty: 20
  });

  useEffect(() => {
    fetch(`${BACKEND_URL}/subscription/1`)
      .then(res => res.json())
      .then(data => {
        setSub(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${BACKEND_URL}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: 1,
          package_name: sub.package_name,
          is_chain_store: sub.brand?.is_chain_store,
          menu_strategy: sub.brand?.menu_strategy,
          modules: {
            has_pos: sub.has_pos,
            has_website: sub.has_website,
            has_customer_app: sub.has_customer_app,
            has_rider_app: sub.has_rider_app,
            has_kds: sub.has_kds,
            has_tv_board: sub.has_tv_board,
            has_warehouse: sub.has_warehouse,
            has_recipes: sub.has_recipes,
            has_marketing: sub.has_marketing,
            has_loyalty: sub.has_loyalty,
          },
          currency,
          module_prices: modulePrices

        })
      });
      setToast('Subscription Updated Successfully!');
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      console.error(e);
      alert('Error updating subscription');
    }
    setSaving(false);
  };

  if (loading || !sub) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-10 h-10 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">SuperAdmin / SaaS Setup</h1>
          <p className="text-gray-500">Manage client subscriptions, modules, and architecture</p>
        </div>
      </div>

      {toast && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-xl flex items-center gap-2 border border-green-200">
          <CheckCircle2 className="w-5 h-5" />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Architecture */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Core Architecture
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Package Name</label>
              <input 
                type="text" 
                value={sub.package_name}
                onChange={e => setSub({ ...sub, package_name: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Billing Currency</label>
              <select 
                value={currency} 
                onChange={e => setCurrency(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-colors bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="QR">Qatari Riyal (QR)</option>
                <option value="SR">Saudi Riyal (SR)</option>
                <option value="PKR">Pakistani Rupee (Rs)</option>
                <option value="GBP">Pound (£)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-800">Chain Store Setup</h3>
                <p className="text-sm text-gray-500">Enable multi-branch management</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={sub.brand?.is_chain_store || false} onChange={e => setSub({ ...sub, brand: { ...sub.brand, is_chain_store: e.target.checked } })} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {sub.brand?.is_chain_store && (
              <div className="p-4 border border-purple-100 bg-purple-50 rounded-xl animate-fade-in">
                <h3 className="font-semibold text-gray-800 mb-3">Menu Strategy</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="menu_strategy" value="UNIFIED" checked={(sub.brand?.menu_strategy || 'UNIFIED') === 'UNIFIED'} onChange={e => setSub({ ...sub, brand: { ...sub.brand, menu_strategy: e.target.value } })} className="accent-purple-600 w-4 h-4" />
                    <span className="text-gray-700">Unified (All branches share same menu)</span>
                  </label>
                </div>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="menu_strategy" value="INDEPENDENT" checked={(sub.brand?.menu_strategy || 'UNIFIED') === 'INDEPENDENT'} onChange={e => setSub({ ...sub, brand: { ...sub.brand, menu_strategy: e.target.value } })} className="accent-purple-600 w-4 h-4" />
                    <span className="text-gray-700">Independent (Each branch has its own menu)</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modules */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Active Modules</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'has_pos', label: 'POS Terminal' },
              { key: 'has_website', label: 'E-commerce Website' },
              { key: 'has_customer_app', label: 'Customer App' },
              { key: 'has_rider_app', label: 'Rider App' },
              { key: 'has_kds', label: 'Kitchen Display (KDS)' },
              { key: 'has_tv_board', label: 'TV Board Signage' },
              { key: 'has_warehouse', label: 'Warehouse / Supply' },
              { key: 'has_recipes', label: 'Recipes / Costing' },
              { key: 'has_marketing', label: 'Marketing / Social' },
              { key: 'has_loyalty', label: 'Loyalty Rewards' },
            ].map(mod => (
              <div key={mod.key} className={`flex flex-col p-3 rounded-xl border transition-colors ${sub[mod.key] ? 'border-purple-200 bg-purple-50/50' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100'}`}>
                <label className="flex items-center gap-3 cursor-pointer w-full mb-2">
                  <input 
                    type="checkbox" 
                    checked={sub[mod.key]}
                    onChange={e => setSub({ ...sub, [mod.key]: e.target.checked })}
                    className="accent-purple-600 w-4 h-4 rounded"
                  />
                  <span className="text-gray-700 font-medium">{mod.label}</span>
                </label>
                {sub[mod.key] && (
                  <div className="flex items-center gap-2 pl-7 mt-1">
                    <span className="text-sm font-bold text-gray-500">{currency}</span>
                    <input 
                      type="number" 
                      value={modulePrices[mod.key]} 
                      onChange={e => setModulePrices({ ...modulePrices, [mod.key]: Number(e.target.value) })}
                      className="w-20 p-1 border border-gray-300 rounded text-sm text-center outline-none focus:border-purple-500"
                    />
                    <span className="text-xs text-gray-400">/ month</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Saving Setup...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
