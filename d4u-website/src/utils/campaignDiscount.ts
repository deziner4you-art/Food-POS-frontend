// Port of d4u-pos-client/src/cart/cartEngine.ts's campaignAppliesToProduct +
// getProductDiscount — same matching rules, adapted for the website's
// Product shape (string id, categoryId holding a category NAME rather than
// a numeric id) and its `published_web` channel flag instead of POS's
// `published_pos`. Kept as a website-local copy rather than a shared package
// since the two apps' Product/CartItem shapes differ enough that a generic
// shared signature would need its own adapter layer anyway.

export function campaignAppliesToProduct(
  camp: any,
  productId: number,
  categoryNumericId: number | undefined,
  storeId?: number,
): boolean {
  const hasStoreTarget = camp.target_stores?.length > 0;
  const hasCategoryTarget = camp.target_categories?.length > 0;
  const hasProductTarget = camp.target_products?.length > 0;

  const storeMatches = hasStoreTarget ? camp.target_stores.some((s: any) => s.id === storeId) : true;
  const categoryMatches = hasCategoryTarget ? camp.target_categories.some((c: any) => c.id === categoryNumericId) : true;
  const productMatches = hasProductTarget ? camp.target_products.some((p: any) => p.id === productId) : true;

  const isGlobal = !hasStoreTarget && !hasCategoryTarget && !hasProductTarget;
  if (isGlobal) return true;
  if (!storeMatches) return false;
  if (hasProductTarget) return productMatches;
  if (hasCategoryTarget) return categoryMatches;
  return true;
}

/** Promotional discount %, based on published (web channel) PERCENTAGE/FLAT campaigns. BOGO is handled separately (see offer cards). */
export function getProductDiscount(
  price: number,
  productId: number,
  categoryNumericId: number | undefined,
  campaigns: any[],
  storeId?: number,
): number {
  let maxDiscount = 0;
  for (const camp of campaigns || []) {
    if (!camp.published_web || camp.campaign_type === 'BOGO') continue;
    if (!campaignAppliesToProduct(camp, productId, categoryNumericId, storeId)) continue;

    const pct = camp.campaign_type === 'FLAT'
      ? (price > 0 ? Math.min(100, ((camp.flat_discount_amount || 0) / price) * 100) : 0)
      : camp.discount_pct;

    if (pct > maxDiscount) maxDiscount = pct;
  }
  return maxDiscount;
}
