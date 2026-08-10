import type { CartItem } from '../types';

// Per-branch tax/delivery settings (CmsSettings, fetched via useStoreData's
// existing GET /cms/settings/:storeId call) -- replaces the previous
// hardcoded, placeholder business rules (13% tax, free delivery over $15,
// $1.50 otherwise) that applied identically to every branch of every brand.
export interface BranchSettings {
  tax_percentage?: number;
  delivery_fee?: number;
  min_order_free_delivery?: number;
}

function lineBasePrice(item: CartItem): number {
  const modifierTotal = Object.values(item.selectedModifiers || {})
    .flat()
    .reduce((sum: number, opt: any) => sum + (opt.priceDelta || 0), 0);
  const base = item.selectedVariant ? item.selectedVariant.price : (item.product.originalPrice ?? item.product.price);
  return base + modifierTotal;
}

// A cart line counts as campaign-discounted only when it's using the base
// (non-variant) price AND that product currently carries a campaign discount
// -- variant prices are never discounted by a campaign (same limitation
// POS's own campaign matching has), so a variant line is always "flat price."
function isCampaignDiscountedLine(item: CartItem): boolean {
  return !item.selectedVariant && !!item.product.isDiscounted;
}

// Undiscounted subtotal -- reconstructs the pre-campaign price via
// product.originalPrice (StoreContext's discountedProducts overwrites
// product.price with the discounted amount before addToCart ever sees it,
// so item.totalPrice alone can't tell subtotal and discount apart).
export function getSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + lineBasePrice(item) * item.quantity, 0);
}

// Automatic per-item campaign discount -- mirrors POS's "Promotional
// Discounts" line (the "-19% off" badge shown on the menu grid).
export function getPromoDiscount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => {
    if (!isCampaignDiscountedLine(item)) return sum;
    const perUnit = (item.product.originalPrice ?? item.product.price) - item.product.price;
    return sum + Math.max(0, perUnit) * item.quantity;
  }, 0);
}

// "Flat price" subtotal eligible for Loyalty Points redemption -- campaigns
// already apply automatically (getPromoDiscount above), so a line that's
// already campaign-discounted can never also be paid down with points; this
// is the same undiscounted-base amount as getSubtotal, restricted to only
// the non-discounted lines.
export function getLoyaltyEligibleSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => {
    if (isCampaignDiscountedLine(item)) return sum;
    return sum + lineBasePrice(item) * item.quantity;
  }, 0);
}

// loyaltyDiscount (a pre-checkout estimate -- the backend recomputes and
// caps this authoritatively at order-creation time, same as tax/delivery)
// reduces the taxable base exactly like a campaign discount does, not a
// post-tax payment credit -- one consistent formula for every discount type.
export function getTax(cart: CartItem[], settings: BranchSettings | null, loyaltyDiscount: number = 0): number {
  const taxable = Math.max(0, getSubtotal(cart) - getPromoDiscount(cart) - loyaltyDiscount);
  return Math.round(taxable * ((settings?.tax_percentage ?? 0) / 100) * 100) / 100;
}

export function getDeliveryFee(
  cart: CartItem[],
  orderType: 'delivery' | 'pickup' | 'dine_in',
  settings: BranchSettings | null,
  loyaltyDiscount: number = 0,
): number {
  if (orderType !== 'delivery' || cart.length === 0) return 0;
  const fee = settings?.delivery_fee ?? 0;
  const freeThreshold = settings?.min_order_free_delivery ?? 0;
  const net = getSubtotal(cart) - getPromoDiscount(cart) - loyaltyDiscount;
  if (freeThreshold > 0 && net >= freeThreshold) return 0;
  return fee;
}

export function getGrandTotal(
  cart: CartItem[],
  orderType: 'delivery' | 'pickup' | 'dine_in',
  settings: BranchSettings | null,
  loyaltyDiscount: number = 0,
): number {
  const net = getSubtotal(cart) - getPromoDiscount(cart) - loyaltyDiscount;
  const total = net + getTax(cart, settings, loyaltyDiscount) + getDeliveryFee(cart, orderType, settings, loyaltyDiscount);
  return Math.max(0, Math.round(total * 100) / 100);
}
