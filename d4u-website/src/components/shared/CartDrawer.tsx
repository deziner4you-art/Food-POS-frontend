import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Promotion } from '../../types';
import { useStore } from '../../context/StoreContext';
import { getDeliveryFee, getDiscountAmount, getGrandTotal, getSubtotal, getTax } from '../../utils/cartMath';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appliedPromo: Promotion | null;
  onRemovePromo: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, appliedPromo, onRemovePromo }) => {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart } = useStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const subtotal = getSubtotal(cart);
  const discountAmount = getDiscountAmount(cart, appliedPromo);
  const deliveryFee = getDeliveryFee(cart, 'delivery');
  const tax = getTax(cart, appliedPromo);
  const grandTotal = getGrandTotal(cart, appliedPromo, 'delivery');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121215] border-l border-white/10 w-full max-w-md h-full flex flex-col justify-between shadow-2xl relative">
        {/* Cart Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Your Order Cart</h2>
              <p className="text-xs text-gray-400">
                {cart.length} {cart.length === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#1A1A1D] border border-white/10 flex items-center justify-center text-gray-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Your cart is empty</h3>
              <p className="text-xs text-gray-400 max-w-xs">Browse the menu and add something delicious!</p>
              <button
                onClick={onClose}
                className="mt-2 bg-[#D4AF37] text-black text-xs font-extrabold px-6 py-2.5 rounded-full gold-glow"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-[#1A1A1D] border border-white/10 rounded-2xl p-3 flex gap-3 relative group"
              >
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white truncate font-display">
                      {item.product.name}{item.selectedVariant && ` (${item.selectedVariant.name})`}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-gray-500 hover:text-rose-400 transition-colors p-1"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(Object.values(item.selectedModifiers || {}).flat().length > 0) && (
                    <div className="text-[10px] text-gray-400 leading-tight">
                      {Object.values(item.selectedModifiers || {})
                        .flat()
                        .map((m: any) => m.name)
                        .join(', ')}
                    </div>
                  )}

                  {item.specialInstructions && (
                    <div className="text-[10px] text-[#D4AF37] italic truncate">
                      "{item.specialInstructions}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-extrabold text-[#D4AF37]">
                      ${item.totalPrice.toFixed(2)}
                    </span>

                    <div className="flex items-center gap-2 bg-[#121215] border border-white/10 rounded-lg p-1">
                      <button
                        onClick={() => decreaseQuantity(item.cartItemId)}
                        className="w-5 h-5 rounded hover:bg-white/10 text-gray-300 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                      <button
                        onClick={() => increaseQuantity(item.cartItemId)}
                        className="w-5 h-5 rounded hover:bg-white/10 text-gray-300 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-white/10 bg-[#0C0C0E] space-y-4">
            {appliedPromo && (
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold">Promo '{appliedPromo.code}' Applied!</span>
                </div>
                <button onClick={onRemovePromo} className="text-gray-400 hover:text-white text-[11px] underline">
                  Remove
                </button>
              </div>
            )}

            {/* Price Breakdown — real D4U tax/delivery rules, not Stitch's demo math */}
            <div className="space-y-1.5 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#D4AF37]">
                  <span>Promo Discount</span>
                  <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span className="font-semibold text-white">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-400">FREE ($15+ order)</span>
                  ) : (
                    `$${deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (13%)</span>
                <span className="font-semibold text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/10 font-display">
                <span>Grand Total</span>
                <span className="text-[#D4AF37] text-base">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate('/checkout');
              }}
              className="w-full bg-[#D4AF37] text-black font-extrabold py-3.5 rounded-xl hover:bg-[#ffe088] transition-all flex items-center justify-center gap-2 gold-glow text-sm"
            >
              Proceed To Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
