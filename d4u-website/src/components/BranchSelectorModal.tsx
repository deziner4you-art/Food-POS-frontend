import React from 'react';
import { Store, MapPin } from 'lucide-react';

interface BranchSelectorModalProps {
  stores: any[];
  onSelect: (storeId: number) => void;
}

export default function BranchSelectorModal({ stores, onSelect }: BranchSelectorModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl animate-scale-up">
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store size={40} className="text-orange-500" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Select Your Nearest Branch</h2>
        <p className="text-slate-400 mb-8">Please choose the branch you want to order from to see the correct menu and prices.</p>
        
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {stores.length === 0 && (
            <p className="text-slate-500 italic">Loading branches...</p>
          )}
          {stores.map(store => (
            <button
              key={store.id}
              onClick={() => onSelect(store.id)}
              className="w-full bg-slate-800 hover:bg-orange-500/10 border border-slate-700 hover:border-orange-500/50 p-4 rounded-xl flex items-center gap-4 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-full bg-slate-700 group-hover:bg-orange-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                <MapPin size={24} className="text-slate-400 group-hover:text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors">{store.name}</h3>
                <p className="text-sm text-slate-400">{store.location || 'Location details not available'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
