import type { CartItem, Promotion } from '../types';

// D4U's real business rules (13% tax, free delivery over $15, $1.50 otherwise).
// Discount formula (percentage/fixed/bogo) matches how campaigns are already
// computed elsewhere in the app; Promotion objects here are always derived
// from real Marketing Hub campaign data (see mapCampaignToPromotion in
// StoreContext.tsx) — never a hardcoded/demo coupon.
const TAX_RATE = 0.13;
const FREE_DELIVERY_THRESHOLD = 15;
const DELIVERY_FEE = 1.5;

export function getSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + (item?.totalPrice || 0), 0);
}

export function getDiscountAmount(cart: CartItem[], appliedPromo: Promotion | null): number {
  const subtotal = getSubtotal(cart);
  if (!appliedPromo) return 0;

  let discount = 0;
  if (appliedPromo.discountType === 'percentage') {
    discount = (subtotal * appliedPromo.discountValue) / 100;
  } else if (appliedPromo.discountType === 'fixed') {
    discount = appliedPromo.discountValue;
  } else if (appliedPromo.discountType === 'bogo') {
    discount = Math.min(subtotal * 0.25, subtotal);
  }
  return Math.min(subtotal, discount);
}

export function getTax(cart: CartItem[], appliedPromo: Promotion | null): number {
  const taxable = Math.max(0, getSubtotal(cart) - getDiscountAmount(cart, appliedPromo));
  return taxable * TAX_RATE;
}

export function getDeliveryFee(cart: CartItem[], orderType: 'delivery' | 'pickup' | 'dine_in' = 'delivery'): number {
  if (orderType !== 'delivery') return 0;
  const subtotal = getSubtotal(cart);
  if (subtotal === 0) return 0;
  return subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export function getGrandTotal(
  cart: CartItem[],
  appliedPromo: Promotion | null,
  orderType: 'delivery' | 'pickup' | 'dine_in' = 'delivery',
): number {
  return Math.max(
    0,
    getSubtotal(cart) - getDiscountAmount(cart, appliedPromo) + getTax(cart, appliedPromo) + getDeliveryFee(cart, orderType),
  );
}
