import { useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getDeliveryFee, getDiscountAmount, getGrandTotal, getSubtotal, getTax, type Coupon } from '../../utils/cartMath';

export default function CartDrawer({
  isOpen,
  onClose,
  appliedCoupon,
  onRemoveCoupon,
}: {
  isOpen: boolean;
  onClose: () => void;
  appliedCoupon: Coupon | null;
  onRemoveCoupon: () => void;
}) {
  const { cart, increaseQuantity, decreaseQuantity } = useStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const subtotal = getSubtotal(cart);
  const discount = getDiscountAmount(cart, appliedCoupon);
  const tax = getTax(cart, appliedCoupon);
  const deliveryFee = getDeliveryFee(cart, 'DELIVERY');
  const grandTotal = getGrandTotal(cart, appliedCoupon, 'DELIVERY');

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-stitch-bg/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-md bg-stitch-panel h-full shadow-2xl flex flex-col justify-between z-10 border-l border-stitch-border">
        <div className="p-5 border-b border-stitch-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-stitch-accent" />
            <h3 className="font-black text-lg text-stitch-ink">Your Basket</h3>
          </div>
          <button onClick={onClose} className="text-stitch-muted hover:text-stitch-ink p-2 rounded-full hover:bg-stitch-surface transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-12 h-12 text-stitch-muted mx-auto mb-3 animate-pulse" />
              <p className="text-stitch-muted font-bold">Your cart is empty.</p>
              <p className="text-xs text-stitch-muted mt-1">Start adding delicious food from our menu!</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.foodItem.id} className="bg-stitch-surface/60 p-4 rounded-2xl border border-stitch-border flex flex-col gap-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-stitch-ink">{item.foodItem.name}</h4>
                    <p className="text-stitch-accent text-xs font-bold font-mono mt-1">${item.foodItem.priceUSD.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center bg-stitch-surface border border-stitch-border rounded-full px-2.5 py-1">
                    <button onClick={() => decreaseQuantity(item.foodItem.id)} className="text-stitch-muted hover:text-stitch-ink p-1">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-stitch-ink text-xs font-bold px-2">{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.foodItem.id)} className="text-stitch-muted hover:text-stitch-ink p-1">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 border-t border-stitch-border bg-stitch-surface/40 space-y-4">
            {appliedCoupon && (
              <div className="flex justify-between items-center bg-stitch-accent/5 border border-stitch-accent/20 px-3 py-2 rounded-xl text-xs">
                <span className="text-stitch-accent font-black">Coupon Applied: {appliedCoupon.code}</span>
                <button onClick={onRemoveCoupon} className="text-stitch-muted hover:text-stitch-danger font-bold">Remove</button>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stitch-muted">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-stitch-accent font-bold">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-stitch-muted">
                <span>GST / Sales Tax (13%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stitch-muted">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-base font-black text-stitch-ink pt-2 border-t border-stitch-border">
                <span>Grand Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate('/checkout');
              }}
              className="w-full bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink font-black py-4 rounded-xl text-sm transition tracking-wider uppercase transform active:scale-95 text-center flex justify-center items-center gap-2 accent-glow"
            >
              Checkout Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
