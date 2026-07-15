import React, { useState, useMemo } from 'react';
import { MapPin, ArrowRight, ChevronDown } from 'lucide-react';

interface BranchSelectorModalProps {
  stores: any[];
  onSelect: (storeId: number) => void;
}

export default function BranchSelectorModal({ stores, onSelect }: BranchSelectorModalProps) {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  // Extract unique cities from store locations (e.g. "Harbanspura, Lahore" → "Lahore")
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    stores.forEach(store => {
      if (store.location) {
        const parts = store.location.split(',');
        const city = parts[parts.length - 1].trim();
        if (city) citySet.add(city);
      }
    });
    // If no city info, return a single "All" group
    if (citySet.size === 0 && stores.length > 0) citySet.add('All Branches');
    return Array.from(citySet).sort();
  }, [stores]);

  // Filter branches by selected city
  const branchesForCity = useMemo(() => {
    if (!selectedCity) return [];
    return stores.filter(store => {
      if (selectedCity === 'All Branches') return true;
      const loc = store.location || '';
      return loc.toLowerCase().includes(selectedCity.toLowerCase());
    });
  }, [stores, selectedCity]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedStoreId(null); // reset branch when city changes
  };

  const handleEnter = () => {
    if (selectedStoreId) onSelect(selectedStoreId);
  };

  const heroBlur = (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-[#ffe1a7]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-[#ffe1a7]/5 rounded-full blur-3xl" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80) center/cover no-repeat' }}>
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0c1322]/85 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative z-10 bg-[#141b2b] border border-[#ffe1a7]/15 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden">
        {heroBlur}

        {/* Header */}
        <div className="relative text-center mb-8">
          <div className="w-16 h-16 bg-[#ffe1a7]/15 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#ffe1a7]/20">
            <MapPin size={30} className="text-[#ffe1a7]" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Select Your Location</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Choose your city and branch to see the<br />customized menu for your local area.
          </p>
        </div>

        {/* Loading state */}
        {stores.length === 0 && (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-[#ffe1a7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading branches...</p>
          </div>
        )}

        {stores.length > 0 && (
          <div className="relative space-y-5">
            {/* City Selector */}
            <div>
              <label className="block text-[10px] font-black text-[#ffe1a7] tracking-[0.15em] uppercase mb-2 pl-1">
                Choose City
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={e => handleCityChange(e.target.value)}
                  className="w-full bg-[#0c1322] border border-slate-700 hover:border-[#ffe1a7]/40 focus:border-[#ffe1a7]/70 text-white rounded-xl px-4 py-3.5 pr-10 appearance-none outline-none cursor-pointer transition-all font-medium text-sm"
                >
                  <option value="">Select a city...</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Branch Selector - only shows after city is selected */}
            <div className={`transition-all duration-300 ${selectedCity ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <label className="block text-[10px] font-black text-[#ffe1a7] tracking-[0.15em] uppercase mb-2 pl-1">
                Choose Branch
              </label>
              <div className="relative">
                <select
                  value={selectedStoreId ?? ''}
                  onChange={e => setSelectedStoreId(Number(e.target.value))}
                  disabled={!selectedCity}
                  className="w-full bg-[#0c1322] border border-slate-700 hover:border-[#ffe1a7]/40 focus:border-[#ffe1a7]/70 text-white rounded-xl px-4 py-3.5 pr-10 appearance-none outline-none cursor-pointer transition-all font-medium text-sm disabled:cursor-not-allowed"
                >
                  <option value="">Select a branch...</option>
                  {branchesForCity.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Enter Button */}
            <div className="pt-2">
              <button
                onClick={handleEnter}
                disabled={!selectedStoreId}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm tracking-wide uppercase transition-all duration-300 ${
                  selectedStoreId
                    ? 'bg-[#ffe1a7] text-[#0c1322] hover:bg-[#fbbf24] hover:shadow-lg hover:shadow-[#ffe1a7]/20 hover:scale-[1.02]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Enter Website
                <ArrowRight size={16} className={selectedStoreId ? 'text-[#0c1322]' : 'text-slate-500'} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
