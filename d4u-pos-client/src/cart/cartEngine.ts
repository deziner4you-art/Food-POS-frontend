import { sumLineItems } from '../utils/cartTotals';
import type { CartLineItem } from './cartTypes';

/** Adds a product (optionally a specific variant) to the cart, merging into an existing line if one already matches. */
export function addToCart(cart: CartLineItem[], product: any, variant?: any): CartLineItem[] {
  const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}`;
  const existing = cart.find(item => (item.cartItemId || item.id) === cartItemId);
  if (existing) {
    return cart.map(item =>
      (item.cartItemId || item.id) === cartItemId ? { ...item, qty: item.qty + 1 } : item
    );
  }
  const priceToUse = variant ? variant.price : product.price;
  const nameToUse = variant ? `${product.name} (${variant.name})` : product.name;
  return [...cart, { ...product, cartItemId, name: nameToUse, price: priceToUse, variant_id: variant?.id, qty: 1 }];
}

/** Adjusts a line's quantity by delta; the line is dropped once quantity reaches 0 (existing behavior). */
export function updateCartItemQty(cart: CartLineItem[], id: string | number, delta: number): CartLineItem[] {
  return cart
    .map(item => {
      if ((item.cartItemId || item.id) === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    })
    .filter((item): item is CartLineItem => item !== null);
}

/** Explicitly removes a line from the cart regardless of quantity. */
export function removeCartItem(cart: CartLineItem[], id: string | number): CartLineItem[] {
  return cart.filter(item => (item.cartItemId || item.id) !== id);
}

function campaignAppliesToProduct(camp: any, product: any, storeId?: number): boolean {
  const hasStoreTarget = camp.target_stores?.length > 0;
  const hasCategoryTarget = camp.target_categories?.length > 0;
  const hasProductTarget = camp.target_products?.length > 0;

  const storeMatches = hasStoreTarget ? camp.target_stores.some((s: any) => s.id === storeId) : true;
  const categoryMatches = hasCategoryTarget ? camp.target_categories.some((c: any) => c.id === product.category_id) : true;
  const productMatches = hasProductTarget ? camp.target_products.some((p: any) => p.id === product.id) : true;

  const isGlobal = !hasStoreTarget && !hasCategoryTarget && !hasProductTarget;
  if (isGlobal) return true;
  if (!storeMatches) return false;
  if (hasProductTarget) return productMatches;
  if (hasCategoryTarget) return categoryMatches;
  return true;
}

/** Promotional per-product discount %, based on published campaigns targeting stores/categories/products. */
export function getProductDiscount(product: any, activeCampaigns: any[], storeId?: number): number {
  if (product.variant_id) return 0;
  if (product.categories?.some((c: any) => ['extra toppings', 'add-ons', 'addons'].includes((c.name || '').toLowerCase()))) return 0;

  let maxDiscount = 0;
  for (const camp of activeCampaigns) {
    if (!camp.published_pos || camp.campaign_type === 'BOGO') continue;
    if (!campaignAppliesToProduct(camp, product, storeId)) continue;

    const pct = camp.campaign_type === 'FLAT'
      ? (product.price > 0 ? Math.min(100, ((camp.flat_discount_amount || 0) / product.price) * 100) : 0)
      : camp.discount_pct;

    if (pct > maxDiscount) maxDiscount = pct;
  }
  return maxDiscount;
}

/**
 * True if this product is already covered by an active, POS-published
 * company promotion (percentage/flat discount OR BOGO, as either the buy or
 * get product) — the single check reused everywhere a manual discount,
 * coupon, or loyalty redemption needs to be blocked.
 */
export function hasActiveCompanyPromotion(product: any, activeCampaigns: any[], storeId?: number): boolean {
  for (const camp of activeCampaigns) {
    if (!camp.published_pos) continue;
    if (camp.campaign_type === 'BOGO') {
      if (camp.buy_product_id === product.id || camp.get_product_id === product.id) return true;
    } else if (campaignAppliesToProduct(camp, product, storeId)) {
      return true;
    }
  }
  return false;
}

/** Active, POS-published BOGO campaigns — used for the "BOGO Deals" section and per-item badges. */
export function getActiveBogoCampaigns(activeCampaigns: any[]): any[] {
  return activeCampaigns.filter(c => c.published_pos && c.campaign_type === 'BOGO');
}

export interface BogoApplication {
  campaignId: number;
  title: string;
  getProductId: number;
  rewardUnits: number;
  discount: number;
}

/**
 * Mirrors the backend's BOGO rule exactly (pos-orders/pricing.service.ts):
 * both the buy product (>= buy_qty) and the get product must already be in
 * the cart; the reward discounts the get-product line rather than
 * auto-adding items. No manual calculation — this is the one place BOGO
 * discount is computed client-side, kept in lockstep with the server.
 */
export function applyBogoRewards(cart: CartLineItem[], activeCampaigns: any[]): BogoApplication[] {
  const applications: BogoApplication[] = [];
  for (const camp of getActiveBogoCampaigns(activeCampaigns)) {
    const buyItem = cart.find(i => i.id === camp.buy_product_id);
    const getItem = cart.find(i => i.id === camp.get_product_id);
    if (!buyItem || !getItem || buyItem.qty < camp.buy_qty) continue;

    const eligibleSets = Math.floor(buyItem.qty / camp.buy_qty);
    const rewardUnits = Math.min(getItem.qty, eligibleSets * camp.reward_qty);
    if (rewardUnits <= 0) continue;

    const discount = camp.reward_type === 'PERCENTAGE'
      ? getItem.price * rewardUnits * ((camp.discount_pct || 100) / 100)
      : getItem.price * rewardUnits;

    applications.push({ campaignId: camp.id, title: camp.title, getProductId: getItem.id, rewardUnits, discount });
  }
  return applications;
}

/** Active, POS-published Free Gift campaigns — mirrors getActiveBogoCampaigns for the gift type. */
export function getActiveFreeGiftCampaigns(activeCampaigns: any[]): any[] {
  return activeCampaigns.filter(c => c.published_pos && c.campaign_type === 'FREE_GIFT');
}

export interface FreeGiftApplication {
  campaignId: number;
  title: string;
  giftProductId: number;
  giftProductName: string;
  discount: number;
}

/**
 * Mirrors the backend's Free Gift rule: once subtotal crosses min_spend, the
 * configured gift product is treated as free (its price becomes the
 * discount) — not physically added to the cart, so the UI must display it as
 * a "+1 Free X" line for the cashier/customer to see.
 */
export function getEligibleFreeGifts(subTotal: number, activeCampaigns: any[]): FreeGiftApplication[] {
  const applications: FreeGiftApplication[] = [];
  for (const camp of getActiveFreeGiftCampaigns(activeCampaigns)) {
    if (camp.min_spend == null || !camp.gift_product_id) continue;
    if (subTotal < camp.min_spend) continue;
    applications.push({
      campaignId: camp.id,
      title: camp.title,
      giftProductId: camp.gift_product_id,
      giftProductName: camp.giftProduct?.name || 'Gift Item',
      discount: camp.giftProduct?.price || 0,
    });
  }
  return applications;
}

/**
 * Bundle/Combo: a fixed price for a matched set of products, all present in
 * the cart with at least 1 unit each. Combos use the exact same mechanic —
 * one execution path for both, matching the backend.
 */
export function getActiveBundleCampaigns(activeCampaigns: any[]): any[] {
  return activeCampaigns.filter(c => c.published_pos && ['BUNDLE', 'COMBO'].includes(c.campaign_type));
}

export function applyBundleDiscounts(cart: CartLineItem[], activeCampaigns: any[]): { campaignId: number; title: string; discount: number }[] {
  const applications: { campaignId: number; title: string; discount: number }[] = [];
  for (const camp of getActiveBundleCampaigns(activeCampaigns)) {
    const bundleProducts = camp.bundle_products || [];
    if (bundleProducts.length === 0 || camp.bundle_price == null) continue;
    const allPresent = bundleProducts.every((p: any) => cart.some(i => i.id === p.id && i.qty >= 1));
    if (!allPresent) continue;

    const componentTotal = bundleProducts.reduce((sum: number, p: any) => {
      const item = cart.find(i => i.id === p.id);
      return sum + (item ? item.price : 0);
    }, 0);
    const discount = Math.max(0, componentTotal - camp.bundle_price);
    if (discount > 0) applications.push({ campaignId: camp.id, title: camp.title, discount });
  }
  return applications;
}

export interface OrderTotals {
  subTotal: number;
  promoDiscountAmount: number;
  bogoDiscountAmount: number;
  bundleDiscountAmount: number;
  giftDiscountAmount: number;
  afterPromo: number;
  discountAmount: number;
  totalDiscountAmount: number;
  afterDiscount: number;
  tax: number;
  grandTotal: number;
  bogoApplications: BogoApplication[];
  bundleApplications: { campaignId: number; title: string; discount: number }[];
  giftApplications: FreeGiftApplication[];
}

/**
 * Full cart -> bill pipeline: subtotal, per-product promo + BOGO discount,
 * then manual discount — but ONLY on items that don't already carry an
 * active company promotion (promotion-priority rule: a company promo blocks
 * manual discount/coupon/loyalty on the same item, everywhere this function
 * is used).
 */
export function calculateOrderTotals(
  cart: CartLineItem[],
  activeCampaigns: any[],
  storeId: number | undefined,
  discountPercent: number,
  taxRate: number = 0.10
): OrderTotals {
  const subTotal = sumLineItems(cart);
  const promoDiscountAmount = cart.reduce((sum, item) => {
    const pct = getProductDiscount(item, activeCampaigns, storeId);
    return sum + item.price * item.qty * (pct / 100);
  }, 0);

  const bogoApplications = applyBogoRewards(cart, activeCampaigns);
  const bogoDiscountAmount = bogoApplications.reduce((sum, a) => sum + a.discount, 0);

  const bundleApplications = applyBundleDiscounts(cart, activeCampaigns);
  const bundleDiscountAmount = bundleApplications.reduce((sum, a) => sum + a.discount, 0);

  const giftApplications = getEligibleFreeGifts(subTotal, activeCampaigns);
  const giftDiscountAmount = giftApplications.reduce((sum, a) => sum + a.discount, 0);

  const afterPromo = subTotal - promoDiscountAmount - bogoDiscountAmount - bundleDiscountAmount - giftDiscountAmount;

  // Promotion-priority rule (defense in depth — the UI itself rejects the
  // action before setting discountPercent/redeemedPoints; this is the
  // second, always-on enforcement point): if ANY cart item already carries
  // a company promotion, manual discount does not apply at all.
  const cartHasCompanyPromotion = cart.some(item => hasActiveCompanyPromotion(item, activeCampaigns, storeId));
  const discountAmount = cartHasCompanyPromotion ? 0 : afterPromo * (discountPercent / 100);

  const totalDiscountAmount = promoDiscountAmount + bogoDiscountAmount + bundleDiscountAmount + giftDiscountAmount + discountAmount;
  const afterDiscount = subTotal - totalDiscountAmount;
  const tax = afterDiscount * taxRate;
  const grandTotal = afterDiscount + tax;
  return {
    subTotal, promoDiscountAmount, bogoDiscountAmount, bundleDiscountAmount, giftDiscountAmount,
    afterPromo, discountAmount, totalDiscountAmount, afterDiscount, tax, grandTotal,
    bogoApplications, bundleApplications, giftApplications,
  };
}
