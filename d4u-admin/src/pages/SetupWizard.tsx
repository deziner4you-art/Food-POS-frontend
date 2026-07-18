import React, { useState, useEffect } from 'react';
import { CheckCircle, Store, Globe, ShieldCheck, ChevronRight, PackageCheck, Monitor, Utensils, Users, Smartphone, Tv, AlertCircle, Building2 } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

type PricingModule = {
  module_key: string;
  module_name: string;
  price_monthly: number;
  currency: string;
};

export default function SetupWizard() {
  const { brands } = useAdminContext(); // Re-use the fetched brands
  const [setupType, setSetupType] = useState<'NEW_BRAND' | 'NEW_BRANCH' | null>(null);
  const [step, setStep] = useState(0); // Step 0 is choosing setup type
  const [loading, setLoading] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Pricing
  const [pricingList, setPricingList] = useState<PricingModule[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    existing_brand_id: '',
    brand_name: '',
    store_location: '',
    currency: 'USD',
    vat_percentage: 0,
    is_chain_store: false,
    menu_strategy: 'UNIFIED', // UNIFIED or INDEPENDENT
    admin_name: '',
    admin_phone: '',
    admin_password: '',
  });

  const [selectedModules, setSelectedModules] = useState<string[]>(['BASE_POS']);

  useEffect(() => {
    fetch(`${BACKEND_URL}/subscription/pricing`)
      .then(res => res.json())
      .then(data => setPricingList(data))
      .catch(console.error);
  }, []);

  const handleToggleModule = (key: string) => {
    if (key === 'BASE_POS') return; // Mandatory
    setSelectedModules(prev => 
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  const calculateTotal = () => {
    return pricingList
      .filter(p => selectedModules.includes(p.module_key))
      .reduce((sum, p) => sum + p.price_monthly, 0);
  };

  const handleBrandSelect = async (brandId: string) => {
    setFormData(prev => ({ ...prev, existing_brand_id: brandId }));
    
    // Auto-fetch modules for this brand
    if (brandId) {
      try {
        const res = await fetch(`${BACKEND_URL}/subscription/${brandId}`);
        if (res.ok) {
          const sub = await res.json();
          let modules = ['BASE_POS'];
          if (sub.module_analytics_enabled) modules.push('ANALYTICS');
          if (sub.module_kds_enabled) modules.push('KDS');
          if (sub.module_riders_enabled) modules.push('RIDER');
          if (sub.module_tv_board_enabled) modules.push('TV_BOARD');
          if (sub.module_online_website_enabled) modules.push('ONLINE_WEBSITE');
          if (sub.module_loyalty_enabled) modules.push('LOYALTY');
          setSelectedModules(modules);
        }
      } catch (e) {
        console.error('Failed to fetch existing subscription');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        is_existing_brand: setupType === 'NEW_BRANCH',
        existing_brand_id: formData.existing_brand_id,
        brand_name: formData.brand_name,
        store_location: formData.store_location,
        currency: formData.currency,
        vat_percentage: Number(formData.vat_percentage),
        is_chain_store: formData.is_chain_store,
        menu_strategy: formData.menu_strategy,
        selected_modules: selectedModules,
        total_billing_amount: calculateTotal(),
        admin_user: setupType === 'NEW_BRAND' ? {
          name: formData.admin_name,
          phone: formData.admin_phone,
          password: formData.admin_password
        } : undefined
      };

      const res = await fetch(`${BACKEND_URL}/subscription/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        setSetupDone(true);
      } else {
        setErrorMsg(data.message || 'Setup failed. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Network error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const icons: any = {
    'BASE_POS': <Store />,
    'KDS': <Utensils />,
    'RIDER': <Smartphone />,
    'TV_BOARD': <Tv />,
    'ONLINE_WEBSITE': <Globe />,
    'LOYALTY': <Users />,
    'ANALYTICS': <Monitor />
  };

  // ─── SUCCESS SCREEN ───────────────────────────────────────────
  if (setupDone) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="max-w-lg w-full bg-slate-800/90 backdrop-blur-xl border border-[#4edea3]/30 rounded-3xl shadow-2xl p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-[#4edea3]/20 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="text-[#4edea3]" size={52} />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">🎉 Setup Complete!</h1>
          <p className="text-slate-400 mb-2">The store has been successfully created.</p>
          
          <div className="space-y-3 mt-8">
            <a
              href="/admin"
              className="flex items-center justify-center gap-2 w-full bg-[#ec4899] hover:bg-pink-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-pink-500/20"
            >
              <ShieldCheck size={20} /> Go to HQ Admin
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── SETUP TYPE SELECTION ───────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 animate-fade-in font-sans">
        <h1 className="text-3xl font-black text-white mb-2">Business Setup</h1>
        <p className="text-slate-400 mb-8">What would you like to do today?</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {/* New Brand Option */}
          <div 
            onClick={() => { setSetupType('NEW_BRAND'); setStep(1); }}
            className="bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-2xl p-8 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] group flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Building2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Create New Brand</h2>
            <p className="text-slate-400 text-sm">Register a completely new business, set up its first store, and configure its SaaS modules.</p>
          </div>

          {/* New Branch Option */}
          <div 
            onClick={() => { setSetupType('NEW_BRANCH'); setStep(1); }}
            className="bg-slate-800 border border-slate-700 hover:border-[#ec4899] rounded-2xl p-8 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] group flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Store size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Add New Branch</h2>
            <p className="text-slate-400 text-sm">Create a new branch/store under an existing brand and inherit its SaaS services.</p>
          </div>
        </div>

        <button onClick={() => window.location.href = '/admin'} className="mt-10 text-slate-500 hover:text-white transition-colors">
          Cancel and return to HQ
        </button>
      </div>
    );
  }

  // ─── WIZARD ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl flex overflow-hidden min-h-[600px] z-10 animate-fade-in">
        
        {/* Left Side: Summary & Billing */}
        <div className="w-1/3 bg-slate-800/50 p-8 border-r border-slate-700/50 flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <PackageCheck className={setupType === 'NEW_BRAND' ? 'text-blue-500' : 'text-pink-500'} /> 
              {setupType === 'NEW_BRAND' ? 'New Brand Setup' : 'New Branch Setup'}
            </h1>
            <p className="text-sm text-slate-400 mt-2">Configure your custom restaurant ecosystem.</p>
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Assigned Services</h3>
            <p className="text-xs text-slate-500 italic mb-3">Note: Updating services here updates the subscription for the entire brand.</p>
            
            <div className="space-y-3">
              {pricingList.filter(p => selectedModules.includes(p.module_key)).map(p => (
                <div key={p.module_key} className="flex justify-between items-center text-slate-300 text-sm bg-slate-900/30 p-3 rounded-lg border border-slate-700/30">
                  <span className="flex items-center gap-2">{icons[p.module_key] || <CheckCircle size={14}/>} {p.module_name}</span>
                  <span className="font-bold">{p.currency} ${p.price_monthly}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand Total Monthly</p>
                <p className="text-3xl font-black text-white mt-1">
                  {formData.currency} ${calculateTotal().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Wizard Forms */}
        <div className="w-2/3 p-10 flex flex-col relative">
          
          <button onClick={() => setStep(0)} className="absolute top-6 right-6 text-slate-500 hover:text-white text-sm font-bold">
            Cancel
          </button>

          {/* Stepper */}
          <div className="flex items-center gap-4 mb-10">
            <div className={`flex items-center gap-2 font-bold text-sm ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600'}`}>1</div>
              Config
            </div>
            <div className="h-[2px] w-8 bg-slate-700"></div>
            <div className={`flex items-center gap-2 font-bold text-sm ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600'}`}>2</div>
              Modules
            </div>
            {setupType === 'NEW_BRAND' && (
              <>
                <div className="h-[2px] w-8 bg-slate-700"></div>
                <div className={`flex items-center gap-2 font-bold text-sm ${step >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600'}`}>3</div>
                  Account
                </div>
              </>
            )}
          </div>

          {/* Form Content */}
          <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
            
            {step === 1 && (
              <div className="animate-fade-in flex-1 max-w-md space-y-6">
                <h2 className="text-2xl font-black text-white mb-2">Store Configuration</h2>
                
                {setupType === 'NEW_BRANCH' ? (
                  // NEW BRANCH FIELDS
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Existing Brand</label>
                      <select 
                        required
                        value={formData.existing_brand_id}
                        onChange={e => handleBrandSelect(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-pink-500 outline-none"
                      >
                        <option value="" disabled>-- Choose a Brand --</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Branch Location / Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.store_location}
                        onChange={e => setFormData({...formData, store_location: e.target.value})}
                        placeholder="e.g. DHA Phase 6"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-pink-500 outline-none"
                      />
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.is_chain_store} onChange={e => setFormData({...formData, is_chain_store: e.target.checked})} className="w-5 h-5 accent-emerald-500" />
                        <div>
                          <p className="font-bold text-emerald-400">Make this a Chain Store</p>
                          <p className="text-xs text-emerald-400/70">Enable centralized menu syncing capabilities.</p>
                        </div>
                      </label>
                    </div>

                    {formData.is_chain_store && (
                      <div className="mt-4 p-4 border border-slate-700 rounded-xl">
                        <p className="text-sm font-bold text-slate-300 mb-3">Menu Strategy for Chain Stores:</p>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="menu_strategy" value="UNIFIED" checked={formData.menu_strategy === 'UNIFIED'} onChange={e => setFormData({...formData, menu_strategy: e.target.value})} className="accent-blue-500" />
                            <span className="text-sm text-slate-300">Chain store with <strong className="text-white">Same Menu</strong> everywhere</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="menu_strategy" value="INDEPENDENT" checked={formData.menu_strategy === 'INDEPENDENT'} onChange={e => setFormData({...formData, menu_strategy: e.target.value})} className="accent-blue-500" />
                            <span className="text-sm text-slate-300">Chain store with <strong className="text-white">Different Menu</strong> each store</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // NEW BRAND FIELDS
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Brand Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.brand_name}
                        onChange={e => setFormData({...formData, brand_name: e.target.value})}
                        placeholder="e.g. Burger King"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Currency</label>
                        <select 
                          value={formData.currency}
                          onChange={e => setFormData({...formData, currency: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="PKR">PKR (Rs.)</option>
                          <option value="AED">AED (د.إ)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">VAT / Tax %</label>
                        <div className="relative">
                          <input 
                            required
                            type="number" 
                            min="0" max="100"
                            value={formData.vat_percentage}
                            onChange={e => setFormData({...formData, vat_percentage: Number(e.target.value)})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.is_chain_store} onChange={e => setFormData({...formData, is_chain_store: e.target.checked})} className="w-5 h-5 accent-emerald-500" />
                        <div>
                          <p className="font-bold text-emerald-400">Make this a Chain Store</p>
                          <p className="text-xs text-emerald-400/70">Enable centralized menu syncing capabilities.</p>
                        </div>
                      </label>
                    </div>

                    {formData.is_chain_store && (
                      <div className="mt-4 p-4 border border-slate-700 rounded-xl">
                        <p className="text-sm font-bold text-slate-300 mb-3">Menu Strategy for Chain Stores:</p>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="menu_strategy" value="UNIFIED" checked={formData.menu_strategy === 'UNIFIED'} onChange={e => setFormData({...formData, menu_strategy: e.target.value})} className="accent-blue-500" />
                            <span className="text-sm text-slate-300">Chain store with <strong className="text-white">Same Menu</strong> everywhere</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="menu_strategy" value="INDEPENDENT" checked={formData.menu_strategy === 'INDEPENDENT'} onChange={e => setFormData({...formData, menu_strategy: e.target.value})} className="accent-blue-500" />
                            <span className="text-sm text-slate-300">Chain store with <strong className="text-white">Different Menu</strong> each store</span>
                          </label>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in flex-1">
                <h2 className="text-2xl font-black text-white mb-2">Select Services</h2>
                <p className="text-slate-400 mb-6 text-sm">
                  {setupType === 'NEW_BRANCH' 
                    ? "These services will apply to the entire Brand. Unchecking a service will remove it from all stores."
                    : "Pick the features you need to run your business."}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  {pricingList.map(module => (
                    <div 
                      key={module.module_key}
                      onClick={() => handleToggleModule(module.module_key)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedModules.includes(module.module_key) ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'} ${module.module_key === 'BASE_POS' ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`p-2 rounded-lg ${selectedModules.includes(module.module_key) ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                          {icons[module.module_key] || <Store size={20} />}
                        </div>
                        {selectedModules.includes(module.module_key) && <CheckCircle className="text-blue-500" size={20} />}
                      </div>
                      <h4 className="font-bold text-white text-sm">{module.module_name}</h4>
                      <p className="text-xs font-bold text-slate-400 mt-1">{module.currency} ${module.price_monthly} / mo</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && setupType === 'NEW_BRAND' && (
              <div className="animate-fade-in flex-1 max-w-md">
                <h2 className="text-2xl font-black text-white mb-2">Create Admin Account</h2>
                <p className="text-slate-400 mb-8 text-sm">This will be your Head Office master login.</p>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.admin_name}
                      onChange={e => setFormData({...formData, admin_name: e.target.value})}
                      placeholder="John Doe"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <input 
                      required
                      type="text" 
                      value={formData.admin_phone}
                      onChange={e => setFormData({...formData, admin_phone: e.target.value})}
                      placeholder="03000000000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Secure PIN / Password</label>
                    <input 
                      required
                      type="password" 
                      value={formData.admin_password}
                      onChange={e => setFormData({...formData, admin_password: e.target.value})}
                      placeholder="****"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="text-red-400 shrink-0" size={18} />
                <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-slate-700/50">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors">
                  Back
                </button>
              )}
              {(step < 3 && setupType === 'NEW_BRAND') || (step < 2 && setupType === 'NEW_BRANCH') ? (
                <button type="button" onClick={() => {
                  if (setupType === 'NEW_BRANCH' && step === 1 && !formData.existing_brand_id) {
                    setErrorMsg('Please select a brand first.');
                    return;
                  }
                  setErrorMsg('');
                  setStep(step + 1);
                }} className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-[#4edea3] hover:bg-[#4edea3]/90 text-slate-900 rounded-xl font-black transition-all shadow-lg shadow-[#4edea3]/20 disabled:opacity-50">
                  {loading ? 'Processing...' : 'Complete Setup & Deploy'} <ShieldCheck size={18} />
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
