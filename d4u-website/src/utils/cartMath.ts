import type { CartItem } from '../types';

export interface Coupon {
  code: string;
  name: string;
  discountPercent: number;
  description: string;
  target_categories?: any[];
  target_products?: any[];
}

export function getSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.foodItem.priceUSD * item.quantity, 0);
}

export function getDiscountAmount(cart: CartItem[], appliedCoupon: Coupon | null, redeemedPointsDiscount = 0): number {
  let discount = 0;
  const subtotal = getSubtotal(cart);
  if (appliedCoupon) {
    if (appliedCoupon.target_categories?.length || appliedCoupon.target_products?.length) {
      let applicableSubtotal = 0;
      cart.forEach((item) => {
        const productMatches = appliedCoupon.target_products?.some((p: any) => String(p.id) === item.foodItem.id);
        const categoryMatches = appliedCoupon.target_categories?.some((c: any) => c.name === item.foodItem.category);
        if (productMatches || categoryMatches) {
          applicableSubtotal += item.foodItem.priceUSD * item.quantity;
        }
      });
      discount += applicableSubtotal * (appliedCoupon.discountPercent / 100);
    } else {
      discount += subtotal * (appliedCoupon.discountPercent / 100);
    }
  }
  discount += redeemedPointsDiscount;
  return Math.min(subtotal, discount);
}

export function getTax(cart: CartItem[], appliedCoupon: Coupon | null, redeemedPointsDiscount = 0): number {
  const taxable = Math.max(0, getSubtotal(cart) - getDiscountAmount(cart, appliedCoupon, redeemedPointsDiscount));
  return taxable * 0.13;
}

export function getDeliveryFee(cart: CartItem[], deliveryType: 'DELIVERY' | 'PICKUP' | 'DINEIN' = 'DELIVERY'): number {
  if (deliveryType !== 'DELIVERY') return 0;
  const subtotal = getSubtotal(cart);
  if (subtotal === 0) return 0;
  return subtotal > 15 ? 0 : 1.5;
}

export function getGrandTotal(
  cart: CartItem[],
  appliedCoupon: Coupon | null,
  deliveryType: 'DELIVERY' | 'PICKUP' | 'DINEIN' = 'DELIVERY',
  redeemedPointsDiscount = 0,
): number {
  return Math.max(
    0,
    getSubtotal(cart) -
      getDiscountAmount(cart, appliedCoupon, redeemedPointsDiscount) +
      getTax(cart, appliedCoupon, redeemedPointsDiscount) +
      getDeliveryFee(cart, deliveryType),
  );
}
