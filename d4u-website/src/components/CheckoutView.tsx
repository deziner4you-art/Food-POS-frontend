import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Promotion } from '../types';
import { useStore } from '../context/StoreContext';
import { BACKEND_URL } from '../hooks/useStoreData';
import { getDeliveryFee, getDiscountAmount, getGrandTotal, getSubtotal, getTax } from '../utils/cartMath';
import {
  Truck,
  Store,
  Utensils,
  MapPin,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowLeft,
  DollarSign,
  Wallet,
  Loader2
} from 'lucide-react';

type OrderType = 'delivery' | 'pickup' | 'dine_in';
// D4U's real payment methods (matches business/online-orders' accepted values) — not Stitch's fictional card/apple_pay/pos_points set.
type PaymentMethod = 'CASH' | 'CARD' | 'COD' | 'WALLET';

interface CheckoutViewProps {
  appliedPromo: Promotion | null;
  onBackToMenu: () => void;
  onOrderPlaced: (order: any) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ appliedPromo, onBackToMenu, onOrderPlaced }) => {
  const { storeId, cart, clearCart, loggedInUser, kioskMode } = useStore();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<OrderType>(kioskMode ? 'dine_in' : 'delivery');
  const [customAddress, setCustomAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState(loggedInUser?.name || (kioskMode ? 'Kiosk Guest' : ''));
  const [customerPhone, setCustomerPhone] = useState(loggedInUser?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(kioskMode ? 'CASH' : 'COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  const subtotal = getSubtotal(cart);
  const discountAmount = getDiscountAmount(cart, appliedPromo);
  const deliveryFee = getDeliveryFee(cart, orderType);
  const tax = getTax(cart, appliedPromo);
  const grandTotal = getGrandTotal(cart, appliedPromo, orderType);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!kioskMode && (!customerName.trim() || !customerPhone.trim() || (orderType === 'delivery' && !customAddress.trim()))) {
      setError('Please fill in all required details.');
      return;
    }

    setError('');
    setIsPlacingOrder(true);

    const finalAddress =
      orderType === 'delivery'
        ? customAddress.trim()
        : orderType === 'dine_in'
        ? `Table #${tableNumber || 'Walk-in'} (In-Restaurant)`
        : 'Self Pickup at Counter';

    try {
      const res = await fetch(`${BACKEND_URL}/online-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          // Backend's CreateOnlineOrderDto declares `customer`, not
          // `customerName` — the previous field name was silently stripped
          // by the global ValidationPipe's whitelist, so every order landed
          // as "Online Guest" regardless of what the customer actually typed.
          customer: customerName || 'Online Guest',
          customerPhone: customerPhone || '',
          customerAddress: finalAddress,
          // Drives the POS Kitchen Display's Walk-in/Pickup/Online territory
          // label (see KotsService.getActiveKots) -- previously this choice
          // was made in this exact form but never left the browser.
          order_type: orderType === 'pickup' ? 'PICKUP' : orderType === 'dine_in' ? 'DINE_IN' : 'DELIVERY',
          items: cart.map((item) => ({
            product_id: item.product.id,
            variant_id: item.selectedVariant?.id,
            quantity: item.quantity,
            price: item.unitPrice,
            special_inst: Object.values(item.selectedModifiers || {}).flat().length > 0
              ? Object.values(item.selectedModifiers || {}).flat().map((m: any) => `+ ${m.name}`).join(', ')
              : undefined,
          })),
          notes: '',
          payment_method: paymentMethod,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      onOrderPlaced({ id: data.order?.id, status: 'PENDING', eta: orderType === 'delivery' ? 30 : 15 });
      clearCart();
      navigate('/track');
    } catch (err) {
      console.error(err);
      setError('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Menu Selection
        </button>

        <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-semibold">
          <Lock className="w-4 h-4" /> Secure Checkout
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {!kioskMode && (
            <div className="bg-[#16130B] border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-black text-xs font-extrabold flex items-center justify-center">1</span>
                Choose Order Type
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    orderType === 'delivery' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold' : 'bg-[#1A1A1D] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <Truck className="w-6 h-6" />
                  <span className="text-xs">Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    orderType === 'pickup' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold' : 'bg-[#1A1A1D] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <Store className="w-6 h-6" />
                  <span className="text-xs">Self Pickup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('dine_in')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    orderType === 'dine_in' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold' : 'bg-[#1A1A1D] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <Utensils className="w-6 h-6" />
                  <span className="text-xs">Dine-In Table</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#16130B] border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-black text-xs font-extrabold flex items-center justify-center">2</span>
              {orderType === 'delivery' ? 'Delivery Address' : orderType === 'pickup' ? 'Pickup Location' : 'Table Selection'}
            </h3>

            {orderType === 'delivery' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Delivery Address</label>
                <input
                  type="text"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="House / Apartment #, Street Name, Landmark..."
                  className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                  required
                />
              </div>
            )}

            {orderType === 'pickup' && (
              <div className="bg-[#1A1A1D] border border-white/10 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" /> Pickup at the counter
                </div>
                <div className="text-xs text-gray-400">Ready in approximately 15 minutes.</div>
              </div>
            )}

            {orderType === 'dine_in' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Table Number</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="E.g., Table 14"
                  className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                />
              </div>
            )}
          </div>

          {!kioskMode && (
            <div className="bg-[#16130B] border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-black text-xs font-extrabold flex items-center justify-center">3</span>
                Contact &amp; Payment
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Mobile Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-gray-300">Select Payment Option</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button type="button" onClick={() => setPaymentMethod('CASH')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition-all ${paymentMethod === 'CASH' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold' : 'bg-[#1A1A1D] border-white/10 text-gray-400'}`}>
                    <DollarSign className="w-5 h-5" />
                    <span>Cash</span>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('CARD')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition-all ${paymentMethod === 'CARD' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold' : 'bg-[#1A1A1D] border-white/10 text-gray-400'}`}>
                    <CreditCard className="w-5 h-5" />
                    <span>Debit / Card</span>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('COD')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition-all ${paymentMethod === 'COD' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold' : 'bg-[#1A1A1D] border-white/10 text-gray-400'}`}>
                    <Truck className="w-5 h-5" />
                    <span>Cash on Delivery</span>
                  </button>
                  {loggedInUser && (
                    <button type="button" onClick={() => setPaymentMethod('WALLET')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition-all ${paymentMethod === 'WALLET' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold' : 'bg-[#1A1A1D] border-white/10 text-gray-400'}`}>
                      <Wallet className="w-5 h-5" />
                      <span>D4U Loyalty ({loggedInUser.loyalty_points ?? 0} pts)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {kioskMode && (
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-3 text-center text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              Cash payment at counter
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#16130B] border border-[#D4AF37]/30 rounded-2xl p-5 space-y-4 shadow-xl sticky top-28">
            <h3 className="text-base font-bold text-white font-display border-b border-white/10 pb-3">
              Order Summary ({cart.length} items)
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => {
                const modifierNames = Object.values(item.selectedModifiers || {}).flat().map((m: any) => m.name);
                return (
                <div key={item.cartItemId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-[#1A1A1D] text-[#D4AF37] font-bold flex items-center justify-center flex-shrink-0">{item.quantity}x</span>
                    <div className="min-w-0">
                      <span className="text-gray-300 font-medium truncate max-w-[150px] block">
                        {item.product.name}{item.selectedVariant && ` (${item.selectedVariant.name})`}
                      </span>
                      {modifierNames.length > 0 && (
                        <span className="text-[10px] text-gray-500 truncate max-w-[150px] block">{modifierNames.join(', ')}</span>
                      )}
                      {item.specialInstructions && (
                        <span className="text-[10px] text-[#D4AF37] italic truncate max-w-[150px] block">"{item.specialInstructions}"</span>
                      )}
                    </div>
                  </div>
                  <span className="text-white font-semibold flex-shrink-0">${item.totalPrice.toFixed(2)}</span>
                </div>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-3 space-y-2 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#D4AF37]">
                  <span>Applied Promo</span>
                  <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-semibold text-white">{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (13%)</span>
                <span className="font-semibold text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-white/10 font-display">
                <span>Total Amount</span>
                <span className="text-[#D4AF37]">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}

            <button
              type="submit"
              disabled={isPlacingOrder}
              className="w-full bg-[#D4AF37] text-black font-extrabold py-3.5 rounded-xl hover:bg-[#ffe088] transition-all flex items-center justify-center gap-2 gold-glow text-sm disabled:opacity-50"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Placing Order...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Confirm &amp; Place Order (${grandTotal.toFixed(2)})
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
