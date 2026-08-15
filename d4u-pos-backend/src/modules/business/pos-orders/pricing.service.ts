import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { SubscriptionService } from '../../core/subscription/subscription.service';
import { CampaignResolverService } from './campaign-resolver.service';
import { LOYALTY_POINT_VALUE } from '../customers/loyalty.constants';

export interface CartLikeItem {
  product_id?: number;
  id?: number;
  category_id?: number;
  price: number;
  quantity: number;
}

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionService,
    private campaignResolver: CampaignResolverService,
  ) {}

  /**
   * MARKETING-003: delegates entirely to CampaignResolverService — the one
   * shared filter (store/branch/package/module/campaign-enabled/schedule/
   * Happy-Hour) used by every consumer, pricing included. Kept as a
   * pass-through method (rather than inlining the call at every site below)
   * so existing call sites in this file don't need to change.
   */
  async getActiveCampaignsForStore(store_id: number) {
    return this.campaignResolver.getCoreActiveCampaigns(store_id);
  }

  private campaignMatchesItem(campaign: any, item: CartLikeItem): boolean {
    const productId = item.product_id ?? item.id;
    if (campaign.target_products.length === 0 && campaign.target_categories.length === 0) return true; // Entire Branch
    if (campaign.target_products.some((p: any) => p.id === productId)) return true;
    if (campaign.target_categories.some((c: any) => c.id === item.category_id)) return true;
    return false;
  }

  /**
   * Promotion-priority rule: for a given set of matching campaigns, keep only
   * the highest-priority one per product UNLESS every campaign that matches
   * that product has allow_stacking = true (in which case all of them apply).
   * This is the one place this rule is implemented — reused by both discount
   * calculation and the "is this item already promoted" check.
   */
  private resolveEffectiveCampaignsPerItem(campaigns: any[], items: CartLikeItem[]) {
    const discountable = ['PERCENTAGE', 'FLAT'];
    const effectiveByItemIndex: any[][] = items.map(() => []);
    items.forEach((item, idx) => {
      const matches = campaigns.filter((c) => discountable.includes(c.campaign_type) && this.campaignMatchesItem(c, item));
      if (matches.length === 0) return;
      const allStack = matches.every((c) => c.allow_stacking);
      effectiveByItemIndex[idx] = allStack ? matches : [matches[0]]; // matches sorted by priority desc already
    });
    return effectiveByItemIndex;
  }

  /** True if any RUNNING campaign (any type) currently covers this product for this store. */
  async hasActivePromotion(store_id: number, product_ids: number[]): Promise<Record<number, boolean>> {
    const campaigns = await this.getActiveCampaignsForStore(store_id);
    const result: Record<number, boolean> = {};
    for (const pid of product_ids) {
      const fakeItem: CartLikeItem = { product_id: pid, price: 0, quantity: 1 };
      const matchesDiscount = campaigns.some(
        (c) => ['PERCENTAGE', 'FLAT'].includes(c.campaign_type) && this.campaignMatchesItem(c, fakeItem),
      );
      const matchesBogo = campaigns.some((c) => c.campaign_type === 'BOGO' && (c.buy_product_id === pid || c.get_product_id === pid));
      const matchesBundle = campaigns.some(
        (c) => ['BUNDLE', 'COMBO'].includes(c.campaign_type) && c.bundle_products.some((p: any) => p.id === pid),
      );
      const matchesGift = campaigns.some((c) => c.campaign_type === 'FREE_GIFT' && c.gift_product_id === pid);
      result[pid] = matchesDiscount || matchesBogo || matchesBundle || matchesGift;
    }
    return result;
  }

  async calculatePricing(params: {
    store_id: number;
    items: CartLikeItem[];
    couponCode?: string;
    // Delivery fee only ever applies when this is 'DELIVERY' -- Pickup/
    // Dine-In/offline-sync orders never carry one, regardless of branch
    // settings.
    orderType?: 'DELIVERY' | 'PICKUP' | 'DINE_IN' | 'OTHER';
    // Loyalty Points redemption -- customer_id + how many points the
    // customer/cashier chose to redeem. This is never trusted blindly: it's
    // re-capped here against the customer's real balance and the real
    // eligible (non-campaign-discounted) subtotal + delivery fee.
    customer_id?: number;
    pointsToRedeem?: number;
  }) {
    const { store_id, items, couponCode, orderType, customer_id, pointsToRedeem } = params;

    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    let totalDiscount = 0;
    const appliedRules: string[] = [];
    // Tracks which cart lines (by product_id/id) already carry a campaign
    // discount, so Loyalty Points redemption below never stacks with one --
    // "flat price" items only.
    const discountedProductIds = new Set<number>();

    // Order-attribution summary (MARKETING-002 §16) — the single/primary
    // promotion this order is attributed to, plus BOGO/gift line detail.
    let promotionId: number | null = null;
    let promotionType: string | null = null;
    let promotionName: string | null = null;
    let bundleId: number | null = null;
    let comboId: number | null = null;
    const bogoItems: { product_id: number; name: string; qty: number; rewardUnits: number }[] = [];
    const giftItems: { product_id: number; name: string; qty: number }[] = [];

    const activeCampaigns = await this.getActiveCampaignsForStore(store_id);
    const attribute = (campaign: any, discount: number) => {
      if (!promotionId && discount > 0) {
        promotionId = campaign.id;
        promotionType = campaign.campaign_type;
        promotionName = campaign.title;
      }
    };

    // 1. Percentage / Flat campaigns — one effective campaign per item unless stacking is explicitly allowed.
    const effectiveByItem = this.resolveEffectiveCampaignsPerItem(activeCampaigns, items);
    const appliedCampaignIds = new Set<number>();

    items.forEach((item, idx) => {
      const lineTotal = item.price * item.quantity;
      for (const campaign of effectiveByItem[idx]) {
        let discount = 0;
        if (campaign.campaign_type === 'FLAT') {
          discount = Math.min(lineTotal, (campaign.flat_discount_amount || 0) * item.quantity);
        } else {
          discount = lineTotal * (campaign.discount_pct / 100);
        }
        if (discount > 0) {
          totalDiscount += discount;
          attribute(campaign, discount);
          const itemId = item.product_id ?? item.id;
          if (itemId != null) discountedProductIds.add(itemId);
          if (!appliedCampaignIds.has(campaign.id)) {
            appliedCampaignIds.add(campaign.id);
            appliedRules.push(`Campaign: ${campaign.title}`);
          }
        }
      }
    });

    // 2. BOGO — automatic, no manual calculation. Requires both the buy
    // product (>= buy_qty) and the get product to already be in the cart;
    // discounts the get-product line instead of auto-adding items to the cart.
    const bogoCampaigns = activeCampaigns.filter((c) => c.campaign_type === 'BOGO');
    for (const campaign of bogoCampaigns) {
      const buyItem = items.find((i) => (i.product_id ?? i.id) === campaign.buy_product_id);
      const getItem = items.find((i) => (i.product_id ?? i.id) === campaign.get_product_id);
      if (!buyItem || !getItem) continue;
      if (buyItem.quantity < campaign.buy_qty) continue;

      const eligibleSets = Math.floor(buyItem.quantity / campaign.buy_qty);
      const rewardUnits = Math.min(getItem.quantity, eligibleSets * campaign.reward_qty);
      if (rewardUnits <= 0) continue;

      const discount =
        campaign.reward_type === 'PERCENTAGE'
          ? getItem.price * rewardUnits * ((campaign.discount_pct || 100) / 100)
          : getItem.price * rewardUnits; // FREE

      totalDiscount += discount;
      attribute(campaign, discount);
      const getItemId = getItem.product_id ?? getItem.id;
      if (getItemId != null) discountedProductIds.add(getItemId);
      bogoItems.push({ product_id: campaign.get_product_id as number, name: campaign.getProduct?.name || '', qty: getItem.quantity, rewardUnits });
      appliedRules.push(`BOGO: ${campaign.title} (${rewardUnits} free unit${rewardUnits > 1 ? 's' : ''})`);
    }

    // 3. Bundle / Combo — a fixed price for a matched set of products, all
    // present in the cart with at least 1 unit each. Combos use the exact
    // same mechanic as Bundles (a fixed-price product set), just a different
    // label — one execution path, no duplicated logic.
    const bundleCampaigns = activeCampaigns.filter((c) => ['BUNDLE', 'COMBO'].includes(c.campaign_type));
    for (const campaign of bundleCampaigns) {
      if (campaign.bundle_products.length === 0 || campaign.bundle_price == null) continue;
      const allPresent = campaign.bundle_products.every((p: any) =>
        items.some((i) => (i.product_id ?? i.id) === p.id && i.quantity >= 1),
      );
      if (!allPresent) continue;

      const componentTotal = campaign.bundle_products.reduce((sum: number, p: any) => {
        const item = items.find((i) => (i.product_id ?? i.id) === p.id);
        return sum + (item ? item.price : 0);
      }, 0);
      const discount = Math.max(0, componentTotal - campaign.bundle_price);
      if (discount <= 0) continue;

      totalDiscount += discount;
      attribute(campaign, discount);
      for (const p of campaign.bundle_products) discountedProductIds.add(p.id);
      if (campaign.campaign_type === 'BUNDLE') bundleId = campaign.id;
      else comboId = campaign.id;
      appliedRules.push(`${campaign.campaign_type === 'BUNDLE' ? 'Bundle' : 'Combo'}: ${campaign.title} (fixed price Rs.${campaign.bundle_price})`);
    }

    // 4. Free Gift — spend threshold unlocks a free product. Not physically
    // added to the cart server-side; returned as metadata (giftItems) so the
    // ordering channel can display "+1 Free X" and the total already reflects it.
    const giftCampaigns = activeCampaigns.filter((c) => c.campaign_type === 'FREE_GIFT');
    for (const campaign of giftCampaigns) {
      if (campaign.min_spend == null || !campaign.gift_product_id) continue;
      if (subtotal < campaign.min_spend) continue;

      const giftPrice = campaign.giftProduct?.price || 0;
      totalDiscount += giftPrice;
      attribute(campaign, giftPrice);
      giftItems.push({ product_id: campaign.gift_product_id, name: campaign.giftProduct?.name || '', qty: 1 });
      appliedRules.push(`Free Gift: ${campaign.title} (${campaign.giftProduct?.name || 'gift item'})`);
    }

    // 5. Manual Coupons (e.g. CAMP-xx) — kept for backward compatibility with the
    // website's existing coupon-code bridge; a campaign already applies itself
    // automatically above, so this only records the reference, it never double-applies.
    if (couponCode?.startsWith('CAMP-')) {
      const campId = parseInt(couponCode.replace('CAMP-', ''), 10);
      if (!isNaN(campId) && activeCampaigns.some((c) => c.id === campId)) {
        appliedRules.push(`Coupon reference: ${couponCode} (already applied automatically)`);
      }
    }

    // Tax % / delivery fee / loyalty rates are all per-branch settings
    // (CmsSettings), never hardcoded -- fetched once up front since the
    // loyalty redemption section below needs the configured point value and
    // the module toggle before it can run.
    const cmsSettings = await this.prisma.cmsSettings.findUnique({ where: { store_id } });
    const taxPercent = cmsSettings?.tax_percentage ?? 0;
    const pointValue = cmsSettings?.loyalty_point_value ?? LOYALTY_POINT_VALUE;
    // No settings row at all -- never explicitly configured either way --
    // defaults to enabled (matches the pre-toggle historical behavior). A
    // branch only loses loyalty once someone explicitly flips it off.
    const loyaltyModuleEnabled = cmsSettings ? cmsSettings.module_loyalty_enabled : true;

    // 6. Loyalty Points redemption — only against "flat price" lines that
    // aren't already campaign-discounted (discountedProductIds, built up
    // above), plus optionally the delivery fee; capped by both the
    // customer's real balance and the real eligible amount. Pure
    // calculation only — the actual points-ledger deduction happens in the
    // caller (pos-orders/online-orders service) using pointsRedeemed below,
    // once the order is confirmed.
    const eligibleForLoyaltySubtotal = items
      .filter((item) => {
        const itemId = item.product_id ?? item.id;
        return itemId == null || !discountedProductIds.has(itemId);
      })
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Base delivery fee, computed from the free-delivery threshold BEFORE
    // any loyalty discount -- this both avoids a circular dependency (how
    // much delivery fee is redeemable would otherwise depend on how much
    // loyalty discount is applied to the item subtotal, which itself can
    // depend on how much is left over from the delivery portion) and keeps
    // redeeming points from also unlocking a threshold it wouldn't have
    // reached on its own merits.
    let baseDeliveryFee = 0;
    if (orderType === 'DELIVERY') {
      const preLoyaltyAfterDiscount = subtotal - totalDiscount;
      const freeThreshold = cmsSettings?.min_order_free_delivery ?? 0;
      const qualifiesForFreeDelivery = freeThreshold > 0 && preLoyaltyAfterDiscount >= freeThreshold;
      baseDeliveryFee = qualifiesForFreeDelivery ? 0 : cmsSettings?.delivery_fee ?? 0;
    }

    let loyaltyDiscount = 0;
    let itemLoyaltyDiscount = 0;
    let deliveryLoyaltyDiscount = 0;
    let pointsRedeemed = 0;
    const requestedPoints = Math.max(0, Math.floor(pointsToRedeem ?? 0));
    if (loyaltyModuleEnabled && requestedPoints > 0 && customer_id) {
      const customer = await this.prisma.customer.findUnique({ where: { id: customer_id }, select: { loyalty_points: true } });
      const availablePoints = Math.min(requestedPoints, customer?.loyalty_points ?? 0);
      const totalEligible = eligibleForLoyaltySubtotal + baseDeliveryFee;
      const rawLoyaltyValue = Math.min(availablePoints * pointValue, totalEligible);
      // Round down to a whole-point amount -- what we charge must never
      // exceed what we later deduct from the ledger.
      pointsRedeemed = Math.floor(rawLoyaltyValue / pointValue);
      loyaltyDiscount = Math.round(pointsRedeemed * pointValue * 100) / 100;
      // Split deterministically: items first, delivery fee absorbs whatever
      // is left over (capped by baseDeliveryFee via totalEligible above).
      itemLoyaltyDiscount = Math.min(loyaltyDiscount, eligibleForLoyaltySubtotal);
      deliveryLoyaltyDiscount = Math.round((loyaltyDiscount - itemLoyaltyDiscount) * 100) / 100;
    }

    // Loyalty discount reduces the taxable base exactly like a campaign
    // discount does -- one consistent formula for every discount type, not
    // a post-tax payment credit.
    const afterDiscount = subtotal - totalDiscount - itemLoyaltyDiscount;
    const tax = Math.round(afterDiscount * (taxPercent / 100) * 100) / 100;

    const deliveryFee = Math.max(0, Math.round((baseDeliveryFee - deliveryLoyaltyDiscount) * 100) / 100);

    let finalTotal = Math.round((afterDiscount + tax + deliveryFee) * 100) / 100;
    if (finalTotal < 0) finalTotal = 0;

    return {
      subtotal,
      discount: totalDiscount,
      tax,
      taxPercent,
      deliveryFee,
      loyaltyDiscount,
      itemLoyaltyDiscount,
      deliveryLoyaltyDiscount,
      pointsRedeemed,
      eligibleForLoyaltySubtotal,
      total: finalTotal,
      appliedRules,
      promotionId,
      promotionType,
      promotionName,
      promotionDiscount: totalDiscount,
      giftItems,
      bogoItems,
      bundleId,
      comboId,
    };
  }
}
