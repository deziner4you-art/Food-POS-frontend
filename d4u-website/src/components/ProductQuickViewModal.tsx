import React, { useState } from 'react';
import { Product, ModifierGroup, ModifierOption, ProductVariant } from '../types';
import { X, Star, Flame, Clock, Plus, Minus, Check, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    selectedModifiers?: any,
    quantity?: number,
    specialNote?: string,
    selectedVariant?: ProductVariant
  ) => void;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
}) => {
  if (!product) return null;

  // Extra Toppings is offered as its own tab (mirrors the POS's existing
  // "Pizza Sizes"/"Extra Toppings" SELECT_VARIANT modal) only for pizza
  // items that also have sizes to choose -- "in variants choosing screen"
  // per the request. Every other product keeps the existing behavior:
  // Choose Size and any modifier groups stacked, not tabbed.
  const hasVariants = !!product.variants && product.variants.length > 0;
  const isPizza = (product.categoryId || '').toLowerCase().includes('pizza');
  const showToppingsTab = isPizza && hasVariants;
  const [activeTab, setActiveTab] = useState<'size' | 'toppings'>('size');

  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  // Sizes default to the first (usually smallest/cheapest) variant, same
  // as required modifier groups defaulting below -- always a valid
  // selection, no disabled "Add to Order" state needed.
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [selectedModifiers, setSelectedModifiers] = useState<{
    [groupId: string]: ModifierOption[];
  }>(() => {
    // Default select first option for required groups
    const initial: { [groupId: string]: ModifierOption[] } = {};
    if (product.modifierGroups) {
      product.modifierGroups.forEach((group) => {
        if (group.required && group.options.length > 0) {
          initial[group.id] = [group.options[0]];
        } else {
          initial[group.id] = [];
        }
      });
    }
    return initial;
  });

  const handleSelectModifier = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedModifiers((prev) => {
      const current = prev[group.id] || [];
      if (group.required) {
        // Single radio behavior
        return { ...prev, [group.id]: [option] };
      } else {
        // Toggle checkbox behavior
        const exists = current.some((o) => o.id === option.id);
        if (exists) {
          return { ...prev, [group.id]: current.filter((o) => o.id !== option.id) };
        } else {
          return { ...prev, [group.id]: [...current, option] };
        }
      }
    });
  };

  // Calculate unit price with modifiers
  let modifierTotal = 0;
  (Object.values(selectedModifiers) as ModifierOption[][]).forEach((optionsList) => {
    optionsList.forEach((opt) => {
      modifierTotal += opt.priceDelta;
    });
  });

  const unitPrice = (selectedVariant ? selectedVariant.price : product.price) + modifierTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCartSubmit = () => {
    onAddToCart(product, selectedModifiers, quantity, instructions, selectedVariant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#16130B] border border-[#D4AF37]/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 text-gray-300 hover:text-white hover:bg-black border border-white/10 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Image Section */}
        <div className="md:w-1/2 relative bg-[#1A1A1D] min-h-[260px] md:min-h-full">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16130B] via-transparent to-black/30 md:hidden" />

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.isDiscounted && (
              <span className="bg-[#D4AF37] text-black font-extrabold text-xs px-3 py-1 rounded-full shadow-lg">
                -{product.discountPercentage}% Instant Discount
              </span>
            )}
            {product.isBestSeller && (
              <span className="bg-[#1A1A1D]/90 text-[#D4AF37] border border-[#D4AF37]/40 text-xs px-3 py-1 rounded-full font-bold">
                👑 Signature Best Seller
              </span>
            )}
          </div>
        </div>

        {/* Right Product Details & Customization */}
        <div className="md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              {product.rating > 0 && (
                <>
                  <span className="flex items-center gap-1 text-[#D4AF37] font-bold">
                    <Star className="w-4 h-4 fill-[#D4AF37]" /> {product.rating.toFixed(1)}
                  </span>
                  <span>({product.reviewCount} customer reviews)</span>
                </>
              )}
              {product.prepTimeMinutes && (
                <span className="flex items-center gap-1 ml-auto text-gray-400">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> {product.prepTimeMinutes} mins
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold text-white font-display">
              {product.name}
            </h2>

            <p className="text-xs text-gray-300 leading-relaxed mt-2">
              {product.fullDescription}
            </p>

            {/* Calories & Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {product.calories && (
                <span className="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-gray-300">
                  🔥 {product.calories} kcal
                </span>
              )}
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-2.5 py-1 rounded-lg font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Pizza with sizes: Choose Size / Extra Toppings as tabs.
                Everything else keeps the original stacked layout below. */}
            {showToppingsTab && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 bg-[#1A1A1D] border border-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setActiveTab('size')}
                    className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${
                      activeTab === 'size' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Choose Size
                  </button>
                  <button
                    onClick={() => setActiveTab('toppings')}
                    className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${
                      activeTab === 'toppings' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Extra Toppings
                  </button>
                </div>
              </div>
            )}

            {/* Choose Size */}
            {hasVariants && (!showToppingsTab || activeTab === 'size') && (
              <div className={showToppingsTab ? 'mt-4 space-y-2' : 'mt-5 space-y-2 border-t border-white/10 pt-4'}>
                {!showToppingsTab && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase tracking-wider font-display">Choose Size</span>
                    <span className="text-[10px] text-[#D4AF37] font-semibold bg-[#D4AF37]/10 px-2 py-0.5 rounded">Required</span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2">
                  {(product.variants || []).map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold'
                            : 'bg-[#1A1A1D] border-white/10 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-gray-500'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{variant.name}</span>
                        </div>
                        <span className="font-semibold text-gray-400">{formatCurrency(variant.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extra Toppings tab content -- empty state when this pizza has
                no modifier groups configured yet (never fabricated). */}
            {showToppingsTab && activeTab === 'toppings' && (!product.modifierGroups || product.modifierGroups.length === 0) && (
              <div className="mt-4 text-xs text-gray-500 text-center py-6">
                No extra toppings configured for this item yet.
              </div>
            )}

            {/* Modifier Groups */}
            {product.modifierGroups && product.modifierGroups.length > 0 && (!showToppingsTab || activeTab === 'toppings') && (
              <div className={showToppingsTab ? 'mt-4 space-y-4' : 'mt-5 space-y-4 border-t border-white/10 pt-4'}>
                {product.modifierGroups.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white uppercase tracking-wider font-display">
                        {group.name}
                      </span>
                      {group.required && (
                        <span className="text-[10px] text-[#D4AF37] font-semibold bg-[#D4AF37]/10 px-2 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {group.options.map((option) => {
                        const isSelected = (selectedModifiers[group.id] || []).some(
                          (o) => o.id === option.id
                        );
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleSelectModifier(group, option)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                              isSelected
                                ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold'
                                : 'bg-[#1A1A1D] border-white/10 text-gray-300 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                                    : 'border-gray-500'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span>{option.name}</span>
                            </div>
                            {option.priceDelta > 0 && (
                              <span className="font-semibold text-gray-400">
                                +{formatCurrency(option.priceDelta)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Instructions */}
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Kitchen Notes / Special Requests
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="E.g., Extra crispy fries, sauce on the side, no cutlery needed..."
                className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-[#D4AF37] outline-none h-16 resize-none placeholder-gray-500"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              {/* Quantity Controls */}
              <div className="flex items-center gap-3 bg-[#1A1A1D] border border-white/10 rounded-xl p-1.5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold text-white w-6 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Total Calculated Price */}
              <div className="text-right">
                <div className="text-[11px] text-gray-400">Total Price</div>
                <div className="text-xl font-extrabold text-[#D4AF37] font-display">
                  {formatCurrency(totalPrice)}
                </div>
              </div>
            </div>

            <button
              onClick={handleAddToCartSubmit}
              className="w-full bg-[#D4AF37] text-black font-extrabold py-3 rounded-xl hover:bg-[#ffe088] transition-all flex items-center justify-center gap-2 gold-glow text-sm"
            >
              <ShoppingBag className="w-4 h-4" /> Add To Order ({formatCurrency(totalPrice)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
