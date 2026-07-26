import React, { useState, useEffect } from 'react';
import { CheckCircle, Store, Globe, ShieldCheck, ChevronRight, PackageCheck, Monitor, Utensils, Users, Smartphone, Tv, AlertCircle, Building2, Package, ChefHat, Receipt, Megaphone, LayoutTemplate, Truck, Briefcase, Plus } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { apiFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function SetupWizard() {
  const { brands } = useAdminContext();
  const navigate = useNavigate();
  const [setupType, setSetupType] = useState<'NEW_BRAND' | 'NEW_BRANCH' | 'PACKAGE_BLOCK' | null>(null);
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastActionTime, setLastActionTime] = useState(0);
  
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    existing_brand_id: '',
    brand_name: '',
    store_location: '',
    currency: 'USD',
    vat_percentage: 0,
    is_chain_store: false,
    menu_strategy: 'UNIFIED', 
    admin_name: '',
    admin_phone: '',
    admin_password: '',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    address: '',
  });

  useEffect(() => {
    apiFetch('/subscription/package')
      .then(res => res.json())
      .then(data => setPackages(data.filter((p: any) => p.status !== 'ARCHIVED')))
      .catch(console.error);
  }, []);

  const handleBrandSelect = (brandId: string) => {
    setFormData(prev => ({ ...prev, existing_brand_id: brandId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Date.now() - lastActionTime < 800) {
      return; 
    }
    
    // Validation before going to next step
    if (setupType === 'NEW_BRANCH' && step === 1) {
      if (!formData.existing_brand_id) {
        setErrorMsg('Please select a brand first.');
        return;
      }
      // NEW_BRANCH has only 1 step
    } else if (setupType === 'NEW_BRAND') {
      if (step === 1 && !formData.brand_name) {
        setErrorMsg('Brand name is required.');
        return;
      }
      if (step === 2 && !selectedPackageId) {
        setErrorMsg('Please select a Subscription Package.');
        return;
      }
      if (step < 3) {
        setErrorMsg('');
        setStep(step + 1);
        setLastActionTime(Date.now());
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        is_existing_brand: setupType === 'NEW_BRANCH',
        existing_brand_id: Number(formData.existing_brand_id) || undefined,
        brand_name: formData.brand_name,
        store_location: formData.store_location || formData.brand_name,
        currency: formData.currency,
        vat_percentage: Number(formData.vat_percentage),
        is_chain_store: formData.is_chain_store,
        menu_strategy: formData.menu_strategy,
        owner_name: formData.owner_name,
        owner_phone: formData.owner_phone,
        owner_email: formData.owner_email,
        address: formData.address,
        package_id: setupType === 'NEW_BRAND' ? selectedPackageId : undefined,
        admin_user: setupType === 'NEW_BRAND' ? {
          name: formData.admin_name,
          phone: formData.admin_phone,
          password: formData.admin_password
        } : undefined
      };

      const res = await apiFetch('/subscription/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setSetupDone(true);
      } else {
        setErrorMsg(data.message || 'Setup failed');
      }
    } catch (e: any) {
      setErrorMsg('Connection error: ' + e.message);
    }
    setLoading(false);
  };

  if (setupDone) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-20 animate-fade-in text-center">
        <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-500/30">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-4xl font-black text-white mb-4">Setup Complete!</h1>
        <p className="text-slate-400 mb-8">The system has been configured successfully. You can now start using the D4U platform.</p>
        <button 
          onClick={() => window.location.href = '/admin'}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          Go to HQ Overview
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-800">
        <ShieldCheck className="w-10 h-10 text-blue-500" />
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Onboarding Wizard</h1>
          <p className="text-slate-400 text-sm mt-1">Setup new Brands and deploy Branches instantly</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Left Side: Setup Type Selection */}
        <div className="w-80 shrink-0">
          <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-3 shadow-xl">
            <button
              onClick={() => { setSetupType('NEW_BRAND'); setStep(1); setFormData({...formData, is_chain_store: true}); }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all mb-2 ${setupType === 'NEW_BRAND' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <div className={`p-3 rounded-xl ${setupType === 'NEW_BRAND' ? 'bg-white/20' : 'bg-slate-800'}`}>
                <Globe size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg leading-tight">New Brand</h3>
                <p className={`text-xs mt-1 ${setupType === 'NEW_BRAND' ? 'text-blue-100' : 'text-slate-500'}`}>HQ + Multiple Branches</p>
              </div>
            </button>
            <button 
              onClick={() => {
                setSetupType('NEW_BRANCH'); 
                setStep(1); 
                setErrorMsg('');
              }}
              className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all border-2 mb-3 ${setupType === 'NEW_BRANCH' ? 'bg-pink-500/10 border-pink-500' : 'border-transparent hover:bg-slate-800'}`}
            >
              <div className={`p-3 rounded-xl ${setupType === 'NEW_BRANCH' ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Building2 size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg leading-tight">Add Branch</h3>
                <p className={`text-xs mt-1 ${setupType === 'NEW_BRANCH' ? 'text-pink-100' : 'text-slate-500'}`}>Add store to existing Brand</p>
              </div>
            </button>
          </div>
          
          {step > 0 && (
            <div className="mt-8 space-y-4 px-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progress</h4>
              
              {setupType === 'NEW_BRAND' && (
                <>
                  <div className={`flex items-center gap-3 font-bold text-sm ${step >= 1 ? 'text-blue-500' : 'text-slate-600'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${step >= 1 ? 'border-blue-500' : 'border-slate-700'}`}>1</div>
                    Brand Info
                  </div>
                  <div className={`flex items-center gap-3 font-bold text-sm ${step >= 2 ? 'text-blue-500' : 'text-slate-600'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${step >= 2 ? 'border-blue-500' : 'border-slate-700'}`}>2</div>
                    Subscription Package
                  </div>
                  <div className={`flex items-center gap-3 font-bold text-sm ${step >= 3 ? 'text-blue-500' : 'text-slate-600'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${step >= 3 ? 'border-blue-500' : 'border-slate-700'}`}>3</div>
                    Admin Account
                  </div>
                </>
              )}

              {setupType === 'NEW_BRANCH' && (
                <div className={`flex items-center gap-3 font-bold text-sm ${step >= 1 ? 'text-pink-500' : 'text-slate-600'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${step >= 1 ? 'border-pink-500' : 'border-slate-700'}`}>1</div>
                  Branch Config
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Form Content */}
        <div className="flex-1 bg-slate-900 border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative min-h-[500px] flex flex-col">
          {!setupType && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center animate-fade-in">
              <PackageCheck className="w-20 h-20 mb-6 text-slate-800" />
              <h2 className="text-2xl font-bold mb-2">Select an Onboarding Flow</h2>
              <p className="max-w-xs text-sm">Choose whether you are deploying a completely new Brand or just adding another branch to an existing one.</p>
            </div>
          )}

          {setupType && (
            <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
              
              {/* BRAND / BRANCH INFO STEP */}
              {step === 1 && setupType !== 'PACKAGE_BLOCK' && (
                <div className="animate-fade-in flex-1 max-w-md space-y-6">
                  <h2 className="text-2xl font-black text-white mb-2">{setupType === 'NEW_BRANCH' ? 'Branch Configuration' : 'Brand Information'}</h2>
                  
                  {setupType === 'NEW_BRANCH' ? (
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
                    </div>
                  ) : (
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Owner Name</label>
                          <input 
                            type="text" 
                            value={formData.owner_name}
                            onChange={e => setFormData({...formData, owner_name: e.target.value})}
                            placeholder="e.g. John Doe"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Owner Mobile</label>
                          <input 
                            type="text" 
                            value={formData.owner_phone}
                            onChange={e => setFormData({...formData, owner_phone: e.target.value})}
                            placeholder="0300..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Business Email</label>
                          <input 
                            type="email" 
                            value={formData.owner_email}
                            onChange={e => setFormData({...formData, owner_email: e.target.value})}
                            placeholder="business@example.com"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">HQ Address / City</label>
                          <input 
                            type="text" 
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            placeholder="e.g. DHA, Lahore"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PACKAGE SELECTION STEP */}
              {step === 2 && setupType === 'NEW_BRAND' && (
                <div className="animate-fade-in flex-1 flex flex-col min-h-0">
                  <h2 className="text-2xl font-black text-white mb-2">Select Subscription Package</h2>
                  <p className="text-slate-400 mb-6 text-sm">Choose the SaaS plan to assign to this brand.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto pr-4 custom-scrollbar pb-6">
                    {packages.length === 0 && <p className="text-slate-500">No packages available. Please create one in SuperAdmin.</p>}
                    
                    {packages.map(pkg => (
                      <div 
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedPackageId === pkg.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-white text-lg">{pkg.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">{pkg.description || 'Standard Plan'}</p>
                          </div>
                          {selectedPackageId === pkg.id && <CheckCircle className="text-blue-500" size={24} />}
                        </div>
                        <div className="mb-4">
                          <span className="text-2xl font-black text-white">{pkg.currency} {pkg.monthly_rental}</span>
                          <span className="text-slate-400 text-xs ml-1">/ {pkg.billing_cycle.toLowerCase()}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-700 pb-1">Included Modules</div>
                        <ul className="space-y-2">
                          {pkg.modules?.map((m: any) => (
                            <li key={m.module_key} className="flex items-center gap-2 text-sm text-slate-300">
                              <CheckCircle size={14} className="text-emerald-500" />
                              {m.module_key}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADMIN ACCOUNT STEP */}
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

              {setupType === 'PACKAGE_BLOCK' && (
                <div className="animate-fade-in flex-1 flex flex-col items-center justify-center text-center">
                  <AlertCircle size={64} className="text-amber-500 mb-6" />
                  <h2 className="text-2xl font-black text-white mb-4">No Subscription Package Available</h2>
                  <p className="text-slate-400 mb-8 max-w-sm">You must create at least one SaaS Subscription Package before creating a brand.</p>
                  <button 
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('d4u_return_to_setup', 'true');
                      navigate('/saas');
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Plus size={20} /> Create Package Now
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <AlertCircle className="text-red-400 shrink-0" size={18} />
                  <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                </div>
              )}

              <div className="flex justify-between items-center bg-slate-900 border-t border-slate-700/50 p-6 rounded-b-3xl shrink-0 mt-6">
                {setupType === 'PACKAGE_BLOCK' ? (
                  <div className="w-full flex justify-end"></div>
                ) : (
                  <>
                    <button 
                      type="button"
                      onClick={() => {
                        if (step > 1) { setStep(step - 1); setErrorMsg(''); }
                        else setSetupType(null);
                      }}
                      className="text-slate-400 font-bold hover:text-white px-4 py-2 transition-colors"
                    >
                      Back
                    </button>
                    <button type="submit" disabled={loading} className={`flex items-center gap-2 px-8 py-3 bg-[#4edea3] hover:bg-[#4edea3]/90 text-slate-900 rounded-xl font-black transition-all shadow-lg shadow-[#4edea3]/20 disabled:opacity-50 ${setupType === 'NEW_BRANCH' ? 'mt-4' : ''}`}>
                      {loading ? 'Processing...' : 'Complete Setup & Deploy'} <ShieldCheck size={18} />
                    </button>
                  </>
                )}
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
