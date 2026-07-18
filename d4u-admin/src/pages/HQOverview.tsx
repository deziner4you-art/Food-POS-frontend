import React, { useState } from 'react';
import { useAdminContext } from '../context/AdminContext';
import { Building2, Store, Plus, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HQOverview() {
  const { brands, setSelectedBranchId, setIsBranchEntered } = useAdminContext();
  const navigate = useNavigate();
  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null);

  const handleEnterStore = (storeId: number) => {
    setSelectedBranchId(storeId);
    setIsBranchEntered(true);
  };

  const toggleBrand = (brandId: number, storeCount: number, firstStoreId: number) => {
    if (storeCount === 1) {
      // Auto-enter if only 1 store
      handleEnterStore(firstStoreId);
    } else {
      setExpandedBrandId(prev => prev === brandId ? null : brandId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center animate-fade-in">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-white">HQ Overview</h1>
            <p className="text-slate-400 mt-2 text-lg">Select a brand or branch to manage</p>
          </div>
          <button 
            onClick={() => navigate('/setup')}
            className="bg-[#ec4899] hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all hover:scale-105"
          >
            <Plus size={20} /> Add New Branch / Brand
          </button>
        </div>

        {/* Brands List */}
        <div className="space-y-6">
          {brands.length === 0 && (
            <div className="bg-slate-800 border border-slate-700 p-10 rounded-2xl text-center">
              <Building2 size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Brands Found</h3>
              <p className="text-slate-400">Click the button above to create your first business.</p>
            </div>
          )}

          {brands.map(brand => {
            const isExpanded = expandedBrandId === brand.id;
            const hasMultipleStores = brand.stores.length > 1;

            return (
              <div key={brand.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl transition-all">
                {/* Brand Header */}
                <div 
                  onClick={() => toggleBrand(brand.id, brand.stores.length, brand.stores[0]?.id)}
                  className={`p-6 flex items-center justify-between cursor-pointer hover:bg-slate-700/50 transition-colors ${isExpanded ? 'border-b border-slate-700 bg-slate-800' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">{brand.name}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Store size={14} /> {brand.stores.length} Branch{brand.stores.length !== 1 ? 'es' : ''}
                        </span>
                        {brand.is_chain_store && (
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/20">
                            Chain Store
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {hasMultipleStores && (
                    <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      <ChevronRight size={24} />
                    </div>
                  )}
                  {!hasMultipleStores && brand.stores.length === 1 && (
                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg pointer-events-none">
                      Enter Dashboard
                    </button>
                  )}
                  {brand.stores.length === 0 && (
                    <span className="text-slate-500 text-sm italic">No stores yet</span>
                  )}
                </div>

                {/* Stores List (Expanded) */}
                {isExpanded && hasMultipleStores && (
                  <div className="bg-slate-900/50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {brand.stores.map(store => (
                        <div 
                          key={store.id} 
                          onClick={() => handleEnterStore(store.id)}
                          className="bg-slate-800 border border-slate-700 p-5 rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{store.name}</h3>
                            <CheckCircle2 size={18} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-sm text-slate-400 flex items-center gap-1">
                            <Store size={14} /> {store.location || 'No location set'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
