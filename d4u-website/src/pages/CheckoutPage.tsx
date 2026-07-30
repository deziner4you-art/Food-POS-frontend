import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BACKEND_URL } from '../hooks/useStoreData';
import { getGrandTotal, type Coupon } from '../utils/cartMath';

export default function CheckoutPage({ appliedCoupon, onOrderPlaced }: { appliedCoupon: Coupon | null; onOrderPlaced: (order: any) => void }) {
  const { storeId, cart, clearCart, kioskMode, loggedInUser } = useStore();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>(kioskMode ? 'PICKUP' : 'DELIVERY');
  const [customerName, setCustomerName] = useState(loggedInUser?.name || (kioskMode ? 'Kiosk Guest' : ''));
  const [customerPhone, setCustomerPhone] = useState(loggedInUser?.phone || '');
  const [customerAddress, setCustomerAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'COD' | 'WALLET'>(kioskMode ? 'CASH' : 'COD');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [error, setError] = useState('');

  const grandTotal = getGrandTotal(cart, appliedCoupon, deliveryType);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!kioskMode && (!customerName || !customerPhone || (deliveryType === 'DELIVERY' && !customerAddress))) {
      setError('Please fill in all customer details.');
      return;
    }

    setIsSubmittingOrder(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/online-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          customerName: customerName || 'Online Guest',
          customerPhone: customerPhone || '',
          customerAddress: deliveryType === 'DELIVERY' ? customerAddress : `Table ${tableNumber || 'Pickup Counter'}`,
          items: cart.map((c) => ({ product_id: c.foodItem.id, quantity: c.quantity, price: c.foodItem.priceUSD || 0 })),
          notes: '',
          payment_method: paymentMethod,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onOrderPlaced({ id: data.order?.id, status: 'PENDING', eta: 25 });
      clearCart();
      navigate('/track');
    } catch (err: any) {
      setError('Failed to place order. Please try again.');
      console.error(err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-semibold text-stitch-muted hover:text-stitch-ink transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-stitch-panel border border-stitch-border rounded-3xl p-6 sm:p-8">
        <h3 className="text-2xl font-black text-stitch-ink mb-6">Complete Your Order</h3>

        <form onSubmit={handlePlaceOrder} className="space-y-4">
          {!kioskMode && (
            <div className="grid grid-cols-2 gap-2">
              {(['DELIVERY', 'PICKUP'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDeliveryType(type)}
                  className={`py-2 text-xs font-black rounded-lg border transition ${
                    deliveryType === type ? 'bg-stitch-accent text-stitch-accent-ink border-stitch-accent' : 'bg-stitch-surface border-stitch-border text-stitch-muted hover:text-stitch-ink'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {!kioskMode && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest text-stitch-muted uppercase">Customer Name</label>
                <input type="text" placeholder="e.g. John Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-stitch-surface border border-stitch-border rounded-xl px-4 py-3 text-sm text-stitch-ink focus:outline-none focus:border-stitch-accent" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest text-stitch-muted uppercase">Contact Phone</label>
                <input type="tel" placeholder="e.g. +1 (555) 123-4567" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-stitch-surface border border-stitch-border rounded-xl px-4 py-3 text-sm text-stitch-ink focus:outline-none focus:border-stitch-accent" required />
              </div>
            </>
          )}

          {deliveryType === 'DELIVERY' && !kioskMode ? (
            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-widest text-stitch-muted uppercase">Delivery Address</label>
              <textarea rows={2} placeholder="Enter delivery address..." value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full bg-stitch-surface border border-stitch-border rounded-xl px-4 py-3 text-sm text-stitch-ink focus:outline-none focus:border-stitch-accent resize-none" required />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-widest text-stitch-muted uppercase">Table Number</label>
              <input type="text" placeholder="e.g. Table 5" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className="w-full bg-stitch-surface border border-stitch-border rounded-xl px-4 py-3 text-sm text-stitch-ink focus:outline-none focus:border-stitch-accent" />
            </div>
          )}

          {!kioskMode && (
            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-widest text-stitch-muted uppercase">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'CASH', label: 'Cash Payment' },
                  { key: 'CARD', label: 'Credit Card' },
                  { key: 'COD', label: 'Cash on Delivery' },
                  { key: 'WALLET', label: 'Digital Wallet' },
                ].map((method) => (
                  <button
                    key={method.key}
                    type="button"
                    onClick={() => setPaymentMethod(method.key as any)}
                    className={`py-3 text-xs font-bold rounded-xl border text-center transition ${
                      paymentMethod === method.key ? 'bg-stitch-accent text-stitch-accent-ink border-stitch-accent font-black' : 'bg-stitch-surface border-stitch-border text-stitch-muted'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {kioskMode && (
            <div className="bg-stitch-accent/10 border border-stitch-accent/30 rounded-xl p-3 text-center text-xs font-bold text-stitch-accent uppercase tracking-wider">
              Cash payment at counter
            </div>
          )}

          <div className="bg-stitch-surface/50 rounded-2xl p-4 border border-stitch-border text-xs space-y-1">
            <div className="flex justify-between text-stitch-muted">
              <span>Tax &amp; Delivery Fee included</span>
              <span className="font-bold text-stitch-ink">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-xs text-stitch-danger font-bold">{error}</p>}

          <button
            type="submit"
            disabled={isSubmittingOrder}
            className="w-full bg-stitch-accent text-stitch-accent-ink hover:bg-stitch-accent-hover font-black py-4 rounded-xl transition flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 transform hover:scale-[1.02] uppercase tracking-wider text-sm mt-4 accent-glow"
          >
            {isSubmittingOrder ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Placing Order...
              </>
            ) : (
              'Place Order'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
