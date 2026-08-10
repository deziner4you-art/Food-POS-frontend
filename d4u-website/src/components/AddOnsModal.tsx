import React from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/currency';
import { X, Plus } from 'lucide-react';

interface AddOnsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mirrors POS's own Add-ons modal exactly: click an add-on, it becomes its
// own ordinary independent cart line (App.tsx's ADD_ONS modal just calls
// addToCart(addon)) -- no nesting, no new order-schema needed, since it's
// the same code path as adding any other menu product.
export const AddOnsModal: React.FC<AddOnsModalProps> = ({ isOpen, onClose }) => {
  const { products, addToCart } = useStore();

  if (!isOpen) return null;

  const addons = products.filter((p) =>
    (p.categories || []).some((c) => ['add-ons', 'addons'].includes((c.name || '').toLowerCase())),
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#121215] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white font-display">Select Add-ons</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
          {addons.length === 0 ? (
            <p className="col-span-full text-center text-sm text-gray-400 py-8">
              No Add-ons found. Please create an "Add-ons" category in the Admin panel and add products to it.
            </p>
          ) : (
            addons.map((addon) => (
              <button
                key={addon.id}
                onClick={() => {
                  addToCart(addon);
                  onClose();
                }}
                className="bg-[#1A1A1D] border border-white/10 hover:border-[#D4AF37]/50 rounded-xl p-3 text-center transition-colors"
              >
                <div className="text-sm font-bold text-white">{addon.name}</div>
                <div className="text-xs text-[#D4AF37] font-semibold mt-1">{formatCurrency(addon.price)}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
