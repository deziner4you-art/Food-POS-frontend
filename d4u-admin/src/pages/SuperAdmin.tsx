import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Plus, Archive, Pencil, Save, AlertCircle, Store, Percent, X, Layers } from 'lucide-react';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';
import { apiFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export const CANONICAL_MODULES = [
  { module_key: 'BASE_POS', module_name: 'Base POS', default_price: 3000 },
  { module_key: 'KOT_PRINT', module_name: 'KOT Printing', default_price: 1000 },
  { module_key: 'ACCOUNTING', module_name: 'POS Accounting', default_price: 2500 },
  { module_key: 'KDS', module_name: 'Kitchen Display System', default_price: 2000 },
  { module_key: 'MARKETING', module_name: 'Marketing Hub', default_price: 2000 },
  { module_key: 'ONLINE_WEBSITE', module_name: 'Online Ordering Website', default_price: 3000 },
  { module_key: 'CMS', module_name: 'Website CMS', default_price: 1500 },
  { module_key: 'CRM', module_name: 'CRM', default_price: 1500 },
  { module_key: 'LOYALTY', module_name: 'Loyalty Program', default_price: 1500 },
  { module_key: 'RIDER', module_name: 'Rider Delivery & Tracking', default_price: 2000 },
  { module_key: 'TV_BOARD', module_name: 'Customer TV Board', default_price: 1500 },
  { module_key: 'INVENTORY', module_name: 'Inventory Management', default_price: 2500 },
  { module_key: 'RECIPES', module_name: 'Recipe Costing & BOM', default_price: 2000 },
  { module_key: 'VENDORS', module_name: 'Vendor Management', default_price: 1500 },
  { module_key: 'ANALYTICS', module_name: 'Executive Analytics & Reporting', default_price: 2500 },
  { module_key: 'HR_PAYROLL', module_name: 'HR & Staff Payroll', default_price: 2000 },
];

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [hasPricingChanges, setHasPricingChanges] = useState(false);
  const [toast, setToast] = useState('');
  
  const [activeTab, setActiveTab] = useState<'PACKAGES' | 'MODULES'>('PACKAGES');
  const [pricingList, setPricingList] = useState<any[]>([]);
  const [globalCurrency, setGlobalCurrency] = useState('PKR');

  const currencySymbols: Record<string, string> = {
    USD: '$',
    PKR: 'Rs',
    AED: 'AED',
    QR: 'QR',
    SR: 'SR',
    POUND: '£'
  };
  const getSymbol = () => currencySymbols[globalCurrency] || 'Rs';

  // Package Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    currency: 'PKR',
    monthly_rental: 0,
    billing_cycle: 'MONTHLY',
    selected_modules: [] as string[],
    module_prices: {} as Record<string, number>,
    discount_pct: 0
  });
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);

  // Assign Package to Branch Modal State
  const [assigningPackage, setAssigningPackage] = useState<any | null>(null);
  const [targetStoreId, setTargetStoreId] = useState<number | ''>('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  const fetchPackagesAndPricing = async () => {
    try {
      // 1. Fetch Packages
      const res = await apiFetch('/subscription/package');
      if (res.ok) {
        const data = await res.json();
        setPackages(data.filter((p: any) => p.status !== 'ARCHIVED'));
      }

      // 2. Fetch Remote Pricing
      let fetchedPricing: any[] = [];
      try {
        const priceRes = await apiFetch(`/subscription/pricing?currency=${globalCurrency}`);
        if (priceRes.ok) {
          fetchedPricing = await priceRes.json();
        }
      } catch (e) {
        console.warn('Remote pricing fetch fallback:', e);
      }

      // 3. Guarantee all 16 Canonical Modules are ALWAYS present!
      const mergedList = CANONICAL_MODULES.map((canon, index) => {
        const found = Array.isArray(fetchedPricing)
          ? fetchedPricing.find((p: any) => p.module_key === canon.module_key)
          : null;
        if (found) {
          return {
            ...found,
            module_name: found.module_name || canon.module_name,
            price_monthly: found.price_monthly !== undefined ? Number(found.price_monthly) : canon.default_price,
            persisted: found.persisted ?? true,
          };
        }
        return {
          id: null,
          module_key: canon.module_key,
          module_name: canon.module_name,
          currency: globalCurrency,
          price_monthly: canon.default_price,
          price_yearly: canon.default_price * 12,
          persisted: false,
          fallback_id: `default-${index + 1}`,
        };
      });

      setPricingList(mergedList);
      setHasPricingChanges(false);

      // 4. Fetch Branches for Quick Assignment
      const storesRes = await apiFetch('/stores');
      if (storesRes.ok) {
        setBranches(await storesRes.json());
      }

      setLoading(false);
    } catch (e) {
      console.error('Data loading error:', e);
      // Even on complete error, keep canonical modules available!
      setPricingList(CANONICAL_MODULES.map((c, i) => ({
        id: null,
        module_key: c.module_key,
        module_name: c.module_name,
        currency: globalCurrency,
        price_monthly: c.default_price,
        price_yearly: c.default_price * 12,
        persisted: false,
        fallback_id: `default-${i + 1}`
      })));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagesAndPricing();
  }, [globalCurrency]);

  const handlePriceChange = (module_key: string, value: string) => {
    const numVal = value === '' ? 0 : Number(value);
    setPricingList(prev => prev.map(p => p.module_key === module_key ? { ...p, price_monthly: numVal } : p));
    setHasPricingChanges(true);
  };

  const handleSaveAllPricing = async () => {
    setSavingPricing(true);
    try {
      const payload = {
        currency: globalCurrency,
        items: pricingList.map(item => ({
          module_key: item.module_key,
          price_monthly: Number(item.price_monthly) || 0
        }))
      };
      const res = await apiFetch('/subscription/pricing', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        if (Array.isArray(updated) && updated.length > 0) {
          setPricingList(updated);
        }
        setHasPricingChanges(false);
        customSuccess(`Pricing for ${globalCurrency} saved successfully!`);
      } else {
        const err = await res.json().catch(() => ({}));
        customAlert(err.message || 'Failed to save pricing');
      }
    } catch (e: any) {
      console.error('Save pricing error:', e);
      customAlert(e.message || 'Failed to save pricing');
    } finally {
      setSavingPricing(false);
    }
  };

  // -------------------------------------------------------------
  // Package Calculations (Subtotal, Discount %, Final Rental)
  // -------------------------------------------------------------
  const selectedModulesSubtotal = (formData.selected_modules || []).reduce((acc: number, key: string) => {
    const custom = formData.module_prices?.[key];
    if (custom !== undefined && custom !== null && !isNaN(Number(custom))) {
      return acc + Number(custom);
    }
    const m = pricingList.find(p => p.module_key === key);
    return acc + (m ? Number(m.price_monthly) || 0 : 0);
  }, 0);

  const discountPercent = Number(formData.discount_pct) || 0;
  const discountAmount = Math.round(selectedModulesSubtotal * (discountPercent / 100));

  const toggleModuleSelection = (key: string) => {
    setFormData((prev: any) => {
      const isSelected = prev.selected_modules.includes(key);
      const newSelected = isSelected
        ? prev.selected_modules.filter((k: string) => k !== key)
        : [...prev.selected_modules, key];
      
      const newSubtotal = newSelected.reduce((acc: number, k: string) => {
        const custom = prev.module_prices?.[k];
        if (custom !== undefined && custom !== null && !isNaN(Number(custom))) {
          return acc + Number(custom);
        }
        const m = pricingList.find(p => p.module_key === k);
        return acc + (m ? Number(m.price_monthly) || 0 : 0);
      }, 0);

      const dPct = Number(prev.discount_pct) || 0;
      const dAmt = Math.round(newSubtotal * (dPct / 100));
      const newRental = Math.max(0, newSubtotal - dAmt);

      return {
        ...prev,
        selected_modules: newSelected,
        monthly_rental: newRental
      };
    });
  };

  const handleSelectAllModules = () => {
    const allKeys = pricingList.map(p => p.module_key);
    const newSubtotal = allKeys.reduce((acc: number, k: string) => {
      const custom = formData.module_prices?.[k];
      if (custom !== undefined && custom !== null && !isNaN(Number(custom))) {
        return acc + Number(custom);
      }
      const m = pricingList.find(p => p.module_key === k);
      return acc + (m ? Number(m.price_monthly) || 0 : 0);
    }, 0);
    const dPct = Number(formData.discount_pct) || 0;
    const dAmt = Math.round(newSubtotal * (dPct / 100));
    setFormData((prev: any) => ({
      ...prev,
      selected_modules: allKeys,
      monthly_rental: Math.max(0, newSubtotal - dAmt)
    }));
  };

  const handleDeselectAllModules = () => {
    setFormData((prev: any) => ({
      ...prev,
      selected_modules: [],
      monthly_rental: 0
    }));
  };

  const handleDiscountChange = (val: string | number) => {
    const numericVal = val === '' ? 0 : Math.min(100, Math.max(0, Number(val)));
    const dAmt = Math.round(selectedModulesSubtotal * (numericVal / 100));
    const newRental = Math.max(0, selectedModulesSubtotal - dAmt);
    setFormData((prev: any) => ({
      ...prev,
      discount_pct: val,
      monthly_rental: newRental
    }));
  };

  const handleRentalChange = (val: string | number) => {
    const newRental = Number(val) || 0;
    let dPct = 0;
    if (selectedModulesSubtotal > 0 && newRental < selectedModulesSubtotal) {
      dPct = Math.round(((selectedModulesSubtotal - newRental) / selectedModulesSubtotal) * 100);
    }
    setFormData((prev: any) => ({
      ...prev,
      monthly_rental: newRental,
      discount_pct: dPct
    }));
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      customAlert('Package name is required');
      return;
    }
    if (formData.selected_modules.length === 0) {
      customAlert('Please select at least one module for the package');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        currency: formData.currency,
        monthly_rental: Number(formData.monthly_rental) || 0,
        billing_cycle: formData.billing_cycle,
        modules: formData.selected_modules.map((key: string) => {
          const custom = formData.module_prices?.[key];
          if (custom !== undefined && custom !== null && !isNaN(Number(custom))) {
            return { module_key: key, price: Number(custom) };
          }
          const m = pricingList.find(p => p.module_key === key);
          return { module_key: key, price: m ? Number(m.price_monthly) || 0 : 0 };
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
        fetchPackagesAndPricing();

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
        fetchPackagesAndPricing();
      } else {
        const err = await res.json().catch(() => ({}));
        customAlert(err.message || 'Error archiving package');
      }
    } catch (e: any) {
      customAlert(e.message);
    }
  };

  const handleAssignToBranch = async () => {
    if (!targetStoreId || !assigningPackage) {
      customAlert('Please select a branch to assign this package to');
      return;
    }
    setAssigningLoading(true);
    try {
      const res = await apiFetch(`/stores/${targetStoreId}`, {
        method: 'PATCH',
        body: JSON.stringify({ saas_package_id: assigningPackage.id })
      });
      if (res.ok) {
        const targetStore = branches.find(b => b.id === Number(targetStoreId));
        customSuccess(`Package "${assigningPackage.name}" applied to ${targetStore?.name || 'Branch'} successfully!`);
        setAssigningPackage(null);
        setTargetStoreId('');
        fetchPackagesAndPricing();
      } else {
        const err = await res.json().catch(() => ({}));
        customAlert(err.message || 'Failed to assign package to branch');
      }
    } catch (e: any) {
      customAlert(e.message || 'Error assigning package to branch');
    } finally {
      setAssigningLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-gray-500 font-bold">Loading SaaS Configuration...</div>;

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
        <div className="flex items-center gap-3">
          {activeTab === 'MODULES' && (
            <button 
              type="button"
              onClick={handleSaveAllPricing}
              disabled={savingPricing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-md ${
                hasPricingChanges
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-50`}
            >
              <Save size={18} /> {savingPricing ? 'Saving...' : `Save Pricing (${globalCurrency})`}
            </button>
          )}
          <button 
            type="button"
            onClick={() => {
              setEditingPackageId(null);
              const allKeys = CANONICAL_MODULES.map(m => m.module_key);
              const initialSubtotal = allKeys.reduce((acc, k) => {
                const m = pricingList.find(p => p.module_key === k);
                return acc + (m ? Number(m.price_monthly) || 0 : 0);
              }, 0);
              setFormData({
                name: '', 
                description: '', 
                currency: globalCurrency, 
                monthly_rental: initialSubtotal, 
                billing_cycle: 'MONTHLY', 
                selected_modules: allKeys,
                module_prices: {},
                discount_pct: 0
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-purple-200"
          >
            <Plus size={18} /> Create SaaS Package
          </button>
        </div>
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
                <th className="p-4 font-bold">Discount / Savings</th>
                <th className="p-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => {
                const totalVal = Number(pkg.total_value) || 0;
                const discountPct = Number(pkg.discount_pct) || 0;
                return (
                  <tr key={pkg.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">
                      {pkg.name}
                      <div className="text-xs text-gray-400 font-normal mt-1">{pkg.description}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-600">{pkg.billing_cycle}</td>
                    <td className="p-4 font-mono text-purple-600 font-bold text-base">
                      {pkg.currency} {Number(pkg.monthly_rental).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                        <Layers size={12} /> {pkg.modules?.length || 0} Modules
                      </span>
                    </td>
                    <td className="p-4">
                      {discountPct > 0 ? (
                        <div className="flex flex-col">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold w-fit">
                            {discountPct.toFixed(0)}% OFF
                          </span>
                          {totalVal > 0 && (
                            <span className="text-xs text-gray-400 line-through mt-0.5 font-mono">
                              {pkg.currency} {totalVal.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Standard</span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2 items-center">
                      <button 
                        onClick={() => {
                          setAssigningPackage(pkg);
                          setTargetStoreId('');
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1.5 font-bold text-xs border border-purple-200"
                        title="Assign to Branch"
                      >
                        <Store size={15} /> Apply to Branch
                      </button>
                      <button 
                        onClick={() => {
                          setEditingPackageId(pkg.id);
                          setGlobalCurrency(pkg.currency);
                          const pkgModules = pkg.modules?.map((m: any) => m.module_key) || [];
                          const modPrices: Record<string, number> = {};
                          pkg.modules?.forEach((m: any) => {
                            if (m.price) modPrices[m.module_key] = m.price;
                          });
                          setFormData({
                            name: pkg.name,
                            description: pkg.description || '',
                            currency: pkg.currency,
                            monthly_rental: pkg.monthly_rental,
                            billing_cycle: pkg.billing_cycle,
                            selected_modules: pkgModules,
                            module_prices: modPrices,
                            discount_pct: pkg.discount_pct || 0
                          });
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="Edit Package"
                      >
                        <Pencil size={17} />
                      </button>
                      <button 
                        onClick={() => handleArchive(pkg.id)} 
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Archive Package"
                      >
                        <Archive size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No active SaaS packages found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-purple-50/60 p-4 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2 text-purple-900 text-sm">
              <AlertCircle size={18} className="text-purple-600 flex-shrink-0" />
              <span>
                Set monthly base rates for each module in <strong>{globalCurrency}</strong>. Click <strong>Save Pricing</strong> to persist rates for packages and subscriptions.
              </span>
            </div>
            <button 
              type="button"
              onClick={handleSaveAllPricing}
              disabled={savingPricing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md ${
                hasPricingChanges
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-50 flex-shrink-0`}
            >
              <Save size={16} /> {savingPricing ? 'Saving...' : `Save Pricing (${globalCurrency})`}
            </button>
          </div>

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
                      className="bg-white border border-gray-200 rounded px-2 py-1 font-bold outline-none cursor-pointer text-gray-700 hover:text-purple-600 uppercase text-xs tracking-wider"
                    >
                      <option value="PKR">Currency (PKR)</option>
                      <option value="USD">Currency (USD)</option>
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
                  <tr key={item.module_key} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{item.module_name}</td>
                    <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">{item.module_key}</span></td>
                    <td className="p-4 text-gray-500 font-bold">{globalCurrency}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-gray-400 font-bold">{getSymbol()}</span>
                        <input 
                          type="number"
                          min="0"
                          step="1"
                          value={item.price_monthly ?? 0}
                          onChange={(e) => handlePriceChange(item.module_key, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveAllPricing();
                            }
                          }}
                          className="w-32 p-2 border border-gray-200 rounded-lg text-right font-mono font-bold outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-gray-900 bg-white shadow-inner"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mt-4">
            <div className="text-sm text-gray-600 font-medium">
              {hasPricingChanges ? (
                <span className="text-amber-600 font-bold">● You have unsaved pricing changes</span>
              ) : (
                <span className="text-gray-500">All module rates are ready.</span>
              )}
            </div>
            <button 
              type="button"
              onClick={handleSaveAllPricing}
              disabled={savingPricing}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                hasPricingChanges
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-50`}
            >
              <Save size={18} /> {savingPricing ? 'Saving...' : `Save Pricing (${globalCurrency})`}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Create / Edit SaaS Package Modal */}
      {/* ------------------------------------------------------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPackageId ? 'Edit SaaS Package' : 'Create SaaS Package'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Select modules, set prices, apply customer discount %, and produce monthly rental.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSavePackage} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Package Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Package Name *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-colors text-gray-900 font-semibold"
                    placeholder="e.g. Standard Restaurant Plan / Gold Suite"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Billing Cycle</label>
                  <select 
                    value={formData.billing_cycle}
                    onChange={e => setFormData({ ...formData, billing_cycle: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-colors text-gray-900 font-semibold bg-white"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Package Description</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-colors text-gray-900 text-sm"
                    placeholder="e.g. Complete restaurant management bundle with POS, KDS, Rider & Live Analytics"
                  />
                </div>
              </div>

              {/* Module Selection Grid */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Select Included Modules</h4>
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
                      {formData.selected_modules.length} of {pricingList.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="text-xs text-purple-600 hover:text-purple-800 font-bold px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllModules}
                      className="text-xs text-gray-500 hover:text-gray-700 font-bold px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {pricingList.map(mod => {
                    const isSelected = formData.selected_modules.includes(mod.module_key);
                    const currentPrice = formData.module_prices?.[mod.module_key] !== undefined
                      ? formData.module_prices[mod.module_key]
                      : Number(mod.price_monthly) || 0;

                    return (
                      <div 
                        key={mod.module_key}
                        onClick={() => toggleModuleSelection(mod.module_key)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-purple-300 bg-purple-50/70 shadow-sm' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div
                            className="accent-purple-600 w-4 h-4 rounded cursor-pointer"
                          />
                          <div className="truncate">
                            <span className="text-gray-900 font-bold text-sm block truncate">{mod.module_name}</span>
                            <span className="text-gray-400 text-xs font-mono">{mod.module_key}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs font-bold text-gray-400">{getSymbol()}</span>
                          <input 
                            type="number"
                            min="0"
                            value={currentPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setFormData((prev: any) => {
                                const newPrices = { ...prev.module_prices, [mod.module_key]: val };
                                const newSubtotal = prev.selected_modules.reduce((acc: number, k: string) => {
                                  const custom = newPrices[k];
                                  if (custom !== undefined && custom !== null && !isNaN(Number(custom))) {
                                    return acc + Number(custom);
                                  }
                                  const m = pricingList.find(p => p.module_key === k);
                                  return acc + (m ? Number(m.price_monthly) || 0 : 0);
                                }, 0);
                                const dPct = Number(prev.discount_pct) || 0;
                                const dAmt = Math.round(newSubtotal * (dPct / 100));
                                return {
                                  ...prev,
                                  module_prices: newPrices,
                                  monthly_rental: Math.max(0, newSubtotal - dAmt)
                                };
                              });
                            }}
                            className="w-20 p-1.5 border border-gray-200 rounded-lg text-right font-mono font-bold text-xs outline-none focus:border-purple-500 bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Pricing Calculation & Discount Box */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <Percent size={14} className="text-indigo-400" /> Package Pricing & Customer Discount
                  </span>
                  <span className="text-xs text-indigo-300 font-mono">
                    Currency: <strong className="text-white">{globalCurrency}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* 1. Subtotal */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Total Modules Value (Sum)</label>
                    <div className="text-2xl font-black text-white font-mono">
                      {getSymbol()} {selectedModulesSubtotal.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-400">Standard sum of selected modules</span>
                  </div>

                  {/* 2. Discount Input (%) */}
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-indigo-500/30">
                    <label className="block text-xs font-bold text-indigo-200 mb-1.5">
                      Customer Discount (%)
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.discount_pct}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl p-2.5 pr-8 text-right font-mono font-black text-lg text-emerald-400 outline-none focus:border-emerald-400 transition-colors"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-3 text-emerald-400 font-bold text-sm">%</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      {[0, 10, 20, 30, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleDiscountChange(pct)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                            Number(formData.discount_pct) === pct
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-700/80 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Final Monthly Rental */}
                  <div className="bg-indigo-600/30 p-3.5 rounded-2xl border border-indigo-400/30">
                    <label className="block text-xs font-bold text-indigo-200 mb-1.5">
                      Final Monthly Rental ({getSymbol()})
                    </label>
                    <input 
                      type="number"
                      min="0"
                      value={formData.monthly_rental}
                      onChange={(e) => handleRentalChange(e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-400 rounded-xl p-2.5 text-right font-mono font-black text-xl text-white outline-none focus:border-white transition-colors"
                    />
                    <div className="text-right text-[11px] text-emerald-300 mt-1 font-semibold">
                      {discountAmount > 0 ? `Savings: -${getSymbol()} ${discountAmount.toLocaleString()}/mo` : 'No discount applied'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-xs text-indigo-200/80 border-t border-indigo-800/40 flex items-center justify-between">
                  <span>Customer pays: <strong>{getSymbol()} {Number(formData.monthly_rental).toLocaleString()}</strong> per {formData.billing_cycle.toLowerCase()}</span>
                  {discountPercent > 0 && (
                    <span className="text-emerald-400 font-bold">
                      ✓ {discountPercent}% Special Customer Discount Applied
                    </span>
                  )}
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3">
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
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingPackageId ? 'Update Package' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Assign Package to Branch Modal */}
      {/* ------------------------------------------------------------- */}
      {assigningPackage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Store size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Apply Package to Branch</h3>
                  <p className="text-xs text-gray-500">Assign this monthly SaaS plan directly to a branch</p>
                </div>
              </div>
              <button 
                onClick={() => setAssigningPackage(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">Selected Package</span>
                <h4 className="text-lg font-black text-gray-900">{assigningPackage.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 font-mono">
                  <span>Price: <strong className="text-purple-700 font-bold">{assigningPackage.currency} {Number(assigningPackage.monthly_rental).toLocaleString()}</strong> / {assigningPackage.billing_cycle}</span>
                  <span>•</span>
                  <span>{assigningPackage.modules?.length || 0} Modules</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Target Branch
                </label>
                <select
                  value={targetStoreId}
                  onChange={(e) => setTargetStoreId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-semibold text-gray-900 shadow-sm"
                >
                  <option value="">-- Choose Branch --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.location ? `(${b.location})` : ''} — {b.brand?.name || 'Store'} {b.saas_package?.name ? `[Current: ${b.saas_package.name}]` : '[No Package]'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1.5">Applying this package will immediately grant module access and activate the branch's subscription.</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssigningPackage(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignToBranch}
                disabled={assigningLoading || !targetStoreId}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {assigningLoading ? 'Applying...' : 'Apply to Branch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
