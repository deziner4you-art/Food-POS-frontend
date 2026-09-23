import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { getDeliveryFee, getGrandTotal, getLoyaltyEligibleSubtotal, getPromoDiscount, getSubtotal, getTax } from '../../utils/cartMath';
import { formatCurrency } from '../../utils/currency';
import {
  TRACKING_STEPS,
  mapBackendStatusToStep,
  getCustomerStatusLabel,
  getCustomerStatusDescription,
  isOrderTerminal,
} from '../../utils/orderStatusMapper';
import { AddOnsModal } from '../AddOnsModal';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Gift,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    cart, 
    increaseQuantity, 
    decreaseQuantity, 
    removeFromCart, 
    settings, 
    loggedInUser, 
    redeemPoints, 
    setRedeemPoints,
    activeOrder,
  } = useStore();
  const navigate = useNavigate();
  const [showAddOns, setShowAddOns] = useState(false);
  // Inline tracking panel — expanded by default so the customer immediately
  // sees their order progress when they open the cart while an order is active.
  const [showTracker, setShowTracker] = useState(true);

  React.useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original || '';
    };
  }, [isOpen]);

  const handleBrowseMenu = () => {
    onClose();
    if (window.location.pathname === '/menu') {
      setTimeout(() => {
        document.getElementById('menu-catalogue')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate('/menu');
      setTimeout(() => {
        document.getElementById('menu-catalogue')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  };

  if (!isOpen) return null;

  const subtotal = getSubtotal(cart);
  const promoDiscount = getPromoDiscount(cart);

  // Same "redeem all eligible points" estimate CheckoutView computes --
  // points can only pay down "flat price" lines that aren't already
  // campaign-discounted; the backend recomputes and caps this
  // authoritatively at order-creation time from the customer's real balance.
  const loyaltyEligibleSubtotal = getLoyaltyEligibleSubtotal(cart);
  const pointsBalance = loggedInUser?.loyalty_points ?? 0;
  const pointsValue = pointsBalance * (settings?.loyalty_point_value ?? 0);
  const canRedeemPoints = !!loggedInUser && pointsBalance > 0 && loyaltyEligibleSubtotal > 0;
  const estimatedLoyaltyDiscount = redeemPoints && canRedeemPoints ? Math.min(pointsValue, loyaltyEligibleSubtotal) : 0;

  const deliveryFee = getDeliveryFee(cart, 'delivery', settings, estimatedLoyaltyDiscount);
  const tax = getTax(cart, settings, estimatedLoyaltyDiscount);
  const grandTotal = getGrandTotal(cart, 'delivery', settings, estimatedLoyaltyDiscount);

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

        {/* ── Inline Order Tracker ─────────────────────────────────────── */}
        {/* Replaces the old "Track →" banner: the tracking timeline now lives   */}
        {/* directly inside the cart drawer so customers never need a popup.     */}
        {activeOrder && (() => {
          const currentStepIndex = mapBackendStatusToStep(activeOrder.status);
          const isTerminal = isOrderTerminal(activeOrder.status);
          const statusLabel = getCustomerStatusLabel(activeOrder.status);
          const statusDesc = getCustomerStatusDescription(activeOrder.status);
          const amount = Number(activeOrder.totalAmount || activeOrder.total_amount) || 0;

          return (
            <div className="mx-4 sm:mx-6 mt-3 border border-[#D4AF37]/30 rounded-2xl overflow-hidden">
              {/* Collapsible header */}
              <button
                onClick={() => setShowTracker(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#D4AF37]/15 to-amber-950/25 hover:from-[#D4AF37]/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isTerminal ? 'bg-emerald-500/20' : 'bg-[#D4AF37]/20'}`}>
                    <Sparkles className={`w-3.5 h-3.5 ${isTerminal ? 'text-emerald-400' : 'text-[#D4AF37]'}`} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider">Order #{activeOrder.id}</div>
                    <div className="text-xs font-bold text-white leading-none mt-0.5">{statusLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#D4AF37]">{formatCurrency(amount)}</span>
                  {showTracker
                    ? <ChevronUp className="w-4 h-4 text-[#D4AF37]" />
                    : <ChevronDown className="w-4 h-4 text-[#D4AF37]" />}
                </div>
              </button>

              {/* Expandable timeline body */}
              {showTracker && (
                <div className="bg-[#0C0C0E]/80 px-4 py-3 space-y-3">
                  {/* Status description */}
                  <p className="text-[11px] text-gray-400 leading-tight">{statusDesc}</p>

                  {/* Step-by-step timeline */}
                  <div className="space-y-2.5">
                    {TRACKING_STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isDone = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      return (
                        <div key={step.key} className="flex items-start gap-3 relative">
                          {idx < TRACKING_STEPS.length - 1 && (
                            <div
                              className={`absolute left-3.5 top-7 w-0.5 h-5 -z-10 transition-colors ${
                                idx < currentStepIndex ? 'bg-[#D4AF37]/60' : 'bg-white/8'
                              }`}
                            />
                          )}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              isCurrent
                                ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/30 ring-1 ring-[#D4AF37]'
                                : isDone
                                  ? 'bg-[#D4AF37]/75 text-black'
                                  : 'bg-[#1A1A1D] border border-white/10 text-gray-600'
                            }`}
                          >
                            {isDone && !isCurrent ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                            ) : (
                              <Icon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold font-display ${
                                  isCurrent ? 'text-[#D4AF37]' : isDone ? 'text-white' : 'text-gray-600'
                                }`}
                              >
                                {step.label}
                              </span>
                              {isCurrent && !isTerminal && (
                                <span className="text-[9px] text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded-full border border-[#D4AF37]/20 font-semibold animate-pulse">
                                  Now
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight">{step.sub}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Completed call-to-action */}
                  {isTerminal && (
                    <div className="pt-1 border-t border-white/8">
                      <p className="text-[10px] text-emerald-400 font-semibold text-center">
                        ✓ Order completed — thanks for ordering!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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
                onClick={handleBrowseMenu}
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
                      {formatCurrency(item.totalPrice)}
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
            <button
              onClick={() => setShowAddOns(true)}
              className="w-full border border-dashed border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold py-2.5 rounded-xl hover:bg-[#D4AF37]/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Ons
            </button>

            {canRedeemPoints && (
              <label className="flex items-center justify-between gap-2 bg-[#1A1A1D] border border-white/10 rounded-xl p-3 cursor-pointer">
                <span className="flex items-center gap-2 text-xs font-bold text-white">
                  <Gift className="w-4 h-4 text-[#D4AF37]" />
                  Redeem Points ({pointsBalance} pts · up to {formatCurrency(Math.min(pointsValue, loyaltyEligibleSubtotal))})
                </span>
                <input
                  type="checkbox"
                  checked={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.checked)}
                  className="accent-[#D4AF37] w-4 h-4"
                />
              </label>
            )}

            {/* Price Breakdown — real D4U tax/delivery rules, not Stitch's demo math */}
            <div className="space-y-1.5 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-[#D4AF37]">
                  <span>Promotional Discount</span>
                  <span className="font-bold">-{formatCurrency(promoDiscount)}</span>
                </div>
              )}
              {estimatedLoyaltyDiscount > 0 && (
                <div className="flex justify-between text-[#D4AF37]">
                  <span>Redeem Points</span>
                  <span className="font-bold">-{formatCurrency(estimatedLoyaltyDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span className="font-semibold text-white">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-400">FREE</span>
                  ) : (
                    formatCurrency(deliveryFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax ({settings?.tax_percentage ?? 0}%)</span>
                <span className="font-semibold text-white">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/10 font-display">
                <span>Grand Total</span>
                <span className="text-[#D4AF37] text-base">{formatCurrency(grandTotal)}</span>
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
      <AddOnsModal isOpen={showAddOns} onClose={() => setShowAddOns(false)} />
    </div>
  );
};
