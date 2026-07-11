import React, { useState, useEffect } from 'react';
import { CheckCircle, Store, Globe, ShieldCheck, ChevronRight, PackageCheck, Monitor, Utensils, Users, Smartphone, Tv, AlertCircle } from 'lucide-react';

const BACKEND_URL = 'http://localhost:3001';

type PricingModule = {
  module_key: string;
  module_name: string;
  price_monthly: number;
  currency: string;
};

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Pricing
  const [pricingList, setPricingList] = useState<PricingModule[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    brand_name: '',
    currency: 'USD',
    vat_percentage: 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        brand_name: formData.brand_name,
        currency: formData.currency,
        vat_percentage: Number(formData.vat_percentage),
        selected_modules: selectedModules,
        total_billing_amount: calculateTotal(),
        admin_user: {
          name: formData.admin_name,
          phone: formData.admin_phone,
          password: formData.admin_password
        }
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
          <p className="text-slate-400 mb-2">Your restaurant system has been activated.</p>
          <p className="text-slate-500 text-sm mb-8">Your brand, store, subscription, and admin account have all been created successfully.</p>

          <div className="space-y-3">
            <a
              href="/"
              className="flex items-center justify-center gap-2 w-full bg-[#ec4899] hover:bg-pink-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-pink-500/20"
            >
              <ShieldCheck size={20} /> Login to HQ Admin
            </a>
            <a
              href="/owner"
              className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              <Monitor size={18} /> Open Owner Dashboard
            </a>
          </div>

          <p className="text-slate-600 text-xs mt-6">Use the phone number and PIN you just created to log in.</p>
        </div>
      </div>
    );
  }

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
              <PackageCheck className="text-blue-500" /> D4U Setup
            </h1>
            <p className="text-sm text-slate-400 mt-2">Configure your custom restaurant ecosystem.</p>
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Your Package</h3>
            
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
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Monthly</p>
                <p className="text-3xl font-black text-white mt-1">
                  {formData.currency} ${calculateTotal().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Wizard Forms */}
        <div className="w-2/3 p-10 flex flex-col">
          
          {/* Stepper */}
          <div className="flex items-center gap-4 mb-10">
            <div className={`flex items-center gap-2 font-bold text-sm ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600'}`}>1</div>
              Modules
            </div>
            <div className="h-[2px] w-8 bg-slate-700"></div>
            <div className={`flex items-center gap-2 font-bold text-sm ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600'}`}>2</div>
              Store Config
            </div>
            <div className="h-[2px] w-8 bg-slate-700"></div>
            <div className={`flex items-center gap-2 font-bold text-sm ${step >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600'}`}>3</div>
              Account
            </div>
          </div>

          {/* Form Content */}
          <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
            
            {step === 1 && (
              <div className="animate-fade-in flex-1">
                <h2 className="text-2xl font-black text-white mb-2">Select your modules</h2>
                <p className="text-slate-400 mb-6 text-sm">Pick the features you need to run your business. You can upgrade anytime later.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {pricingList.map(module => (
                    <div 
                      key={module.module_key}
                      onClick={() => handleToggleModule(module.module_key)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedModules.includes(module.module_key) ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'} ${module.module_key === 'BASE_POS' ? 'opacity-70' : ''}`}
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

            {step === 2 && (
              <div className="animate-fade-in flex-1 max-w-md">
                <h2 className="text-2xl font-black text-white mb-2">Store Configuration</h2>
                <p className="text-slate-400 mb-8 text-sm">Set up your brand and global financials.</p>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Restaurant / Brand Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.brand_name}
                      onChange={e => setFormData({...formData, brand_name: e.target.value})}
                      placeholder="e.g. Burger King"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                </div>
              </div>
            )}

            {step === 3 && (
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
              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-[#4edea3] hover:bg-[#4edea3]/90 text-slate-900 rounded-xl font-black transition-all shadow-lg shadow-[#4edea3]/20 disabled:opacity-50">
                  {loading ? 'Processing...' : 'Complete Setup & Subscribe'} <ShieldCheck size={18} />
                </button>
              )}
            </div>


          </form>
        </div>
      </div>
    </div>
  );
}
