import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppGateway } from '../../../app.gateway';
import { PricingService } from '../pos-orders/pricing.service';
import { SubscriptionService } from '../../core/subscription/subscription.service';
import { CampaignResolverService, MarketingChannel, CAMPAIGN_INCLUDE } from '../pos-orders/campaign-resolver.service';

const BOGO_VALID_REWARD_TYPES = ['FREE', 'PERCENTAGE'];

export interface AuditMeta {
  userId?: number;
  ip?: string;
  device?: string;
}

@Injectable()
export class MarketingService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
    private pricing: PricingService,
    private subscriptions: SubscriptionService,
    private campaignResolver: CampaignResolverService,
  ) {}

  /** Reused by /marketing/active-promotions — single source of truth lives in PricingService. */
  async getActivePromotions(store_id: number, product_ids: number[]) {
    return this.pricing.hasActivePromotion(store_id, product_ids);
  }

  /** Single entry point the Admin Marketing Hub (and any other consumer) queries to decide what to show/hide. */
  async getCapabilities(store_id: number) {
    return this.subscriptions.getMarketingCapabilities(store_id);
  }

  // Task #2R-F2a: same brand-boundary helper pattern as
  // CatalogService.resolveBrandStoreScope (#2R-F1) — resolves the caller's
  // own brand_id server-side (never trusts a client-supplied brand_id), and
  // if a specific store_id is supplied, verifies it actually belongs to that
  // brand before it's used to scope any query. Omitting store_id returns
  // every store id in the caller's own brand (never a global/unfiltered list).
  private async resolveBrandStoreScope(
    authenticatedUser: any,
    store_id?: number,
  ): Promise<{ brand_id: number; storeIds: number[] }> {
    const brand_id = Number(authenticatedUser?.active_brand_id);
    if (!authenticatedUser || !Number.isFinite(brand_id) || brand_id <= 0) {
      throw new BadRequestException('A valid authenticated brand context is required.');
    }

    if (store_id) {
      const store = await this.prisma.store.findUnique({
        where: { id: store_id },
        select: { brand_id: true },
      });
      if (!store || store.brand_id !== brand_id) {
        throw new BadRequestException('Store not found for authenticated brand.');
      }
      return { brand_id, storeIds: [store_id] };
    }

    const brandStores = await this.prisma.store.findMany({
      where: { brand_id },
      select: { id: true },
    });
    return { brand_id, storeIds: brandStores.map((s) => s.id) };
  }

  /**
   * Best-effort creation-time gate: if the campaign explicitly targets one or
   * more stores, reject if any of them isn't entitled to this campaign_type.
   * Brand-wide (no store target) campaigns skip this check — the real,
   * airtight enforcement always happens at consumption time in
   * CampaignResolverService.getCoreActiveCampaigns, regardless.
   */
  private async assertCampaignTypeAllowed(campaign_type: string, target_store_ids: number[]) {
    if (!target_store_ids || target_store_ids.length === 0) return;
    for (const store_id of target_store_ids) {
      const caps = await this.subscriptions.getMarketingCapabilities(store_id);
      if (!caps.enabled) {
        throw new ForbiddenException(`Marketing is not enabled for store #${store_id}'s current package.`);
      }
      if (!caps.allowedCampaignTypes.includes(campaign_type)) {
        throw new ForbiddenException(`Campaign type "${campaign_type}" is not included in store #${store_id}'s current package.`);
      }
    }
  }

  /**
   * BOGO validation, called from createCampaign/updateCampaign when
   * campaign_type = 'BOGO'. Rejects: buy = get, inactive/deleted products,
   * and an overlapping non-stacking BOGO campaign already running for the
   * same buy or get product. This remains a hard BLOCK (not a warning) since
   * BOGO stacking on the same product is a real pricing-engine ambiguity.
   */
  private async validateBogoCampaign(body: any, excludeCampaignId?: number) {
    if (!body.buy_product_id || !body.get_product_id) {
      throw new BadRequestException('BOGO campaigns require both a Buy Product and a Get Product.');
    }
    if (Number(body.buy_product_id) === Number(body.get_product_id)) {
      throw new BadRequestException('Buy Product and Get Product cannot be the same product.');
    }
    if (body.reward_type && !BOGO_VALID_REWARD_TYPES.includes(body.reward_type)) {
      throw new BadRequestException(`reward_type must be one of: ${BOGO_VALID_REWARD_TYPES.join(', ')}`);
    }

    const [buyProduct, getProduct] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: Number(body.buy_product_id) } }),
      this.prisma.product.findUnique({ where: { id: Number(body.get_product_id) } }),
    ]);
    if (!buyProduct || !buyProduct.is_active) {
      throw new BadRequestException('Buy Product is inactive or does not exist.');
    }
    if (!getProduct || !getProduct.is_active) {
      throw new BadRequestException('Get Product is inactive or does not exist.');
    }

    const overlapping = await this.prisma.marketingCampaign.findMany({
      where: {
        campaign_type: 'BOGO',
        status: 'RUNNING',
        deleted_at: null,
        allow_stacking: false,
        id: excludeCampaignId ? { not: excludeCampaignId } : undefined,
        OR: [
          { buy_product_id: Number(body.buy_product_id) },
          { get_product_id: Number(body.buy_product_id) },
          { buy_product_id: Number(body.get_product_id) },
          { get_product_id: Number(body.get_product_id) },
        ],
      },
    });
    if (overlapping.length > 0) {
      throw new BadRequestException(
        `Another active BOGO campaign ("${overlapping[0].title}") already targets one of these products and does not allow stacking.`,
      );
    }
  }

  /**
   * MARKETING-003 §13/§14 — Duplicate Validation / Conflict Detector.
   * Non-blocking WARNINGS the admin should be shown before saving (unlike
   * validateBogoCampaign above, which throws hard blocks). Checks: duplicate
   * campaign name, duplicate Bundle/Combo product sets, and overlapping
   * product/category/branch scope between two non-stacking Percentage/Flat
   * campaigns.
   */
  async checkConflicts(body: any, excludeId?: number): Promise<string[]> {
    const warnings: string[] = [];
    const campaignType = body.campaign_type || 'PERCENTAGE';
    const notExcluded = excludeId ? { id: { not: excludeId } } : {};

    if (body.title) {
      const nameDup = await this.prisma.marketingCampaign.findFirst({
        where: { title: { equals: body.title, mode: 'insensitive' }, deleted_at: null, ...notExcluded },
      });
      if (nameDup) warnings.push(`A campaign named "${nameDup.title}" already exists (#${nameDup.id}).`);
    }

    const storeIds = (Array.isArray(body.target_store_ids) ? body.target_store_ids : body.target_store_ids ? [body.target_store_ids] : []).map(Number);
    const categoryIds = (Array.isArray(body.target_category_ids) ? body.target_category_ids : body.target_category_ids ? [body.target_category_ids] : []).map(Number);
    const productIds = (Array.isArray(body.target_product_ids) ? body.target_product_ids : body.target_product_ids ? [body.target_product_ids] : []).map(Number);
    const bundleIds = (Array.isArray(body.bundle_product_ids) ? body.bundle_product_ids : body.bundle_product_ids ? [body.bundle_product_ids] : []).map(Number);

    if (['BUNDLE', 'COMBO'].includes(campaignType) && bundleIds.length) {
      const candidates = await this.prisma.marketingCampaign.findMany({
        where: { campaign_type: { in: ['BUNDLE', 'COMBO'] }, status: 'RUNNING', deleted_at: null, ...notExcluded },
        include: { bundle_products: true },
      });
      const sortedNew = [...bundleIds].sort((a, b) => a - b);
      for (const c of candidates) {
        const sortedExisting = c.bundle_products.map((p) => p.id).sort((a, b) => a - b);
        if (sortedExisting.length === sortedNew.length && sortedExisting.every((id, i) => id === sortedNew[i])) {
          warnings.push(`Bundle/Combo "${c.title}" (#${c.id}) already uses this exact product set.`);
        }
      }
    }

    if (['PERCENTAGE', 'FLAT'].includes(campaignType) && !(body.allow_stacking === true || body.allow_stacking === 'true')) {
      const overlapping = await this.prisma.marketingCampaign.findMany({
        where: {
          campaign_type: { in: ['PERCENTAGE', 'FLAT'] },
          status: 'RUNNING',
          deleted_at: null,
          allow_stacking: false,
          ...notExcluded,
        },
        include: { target_products: true, target_categories: true, target_stores: true },
      });
      for (const c of overlapping) {
        const storeOverlap = storeIds.length === 0 || c.target_stores.length === 0 || c.target_stores.some((s) => storeIds.includes(s.id));
        if (!storeOverlap) continue;
        const bothBrandWide = productIds.length === 0 && c.target_products.length === 0 && categoryIds.length === 0 && c.target_categories.length === 0;
        const scopeOverlap =
          bothBrandWide ||
          c.target_products.some((p) => productIds.includes(p.id)) ||
          c.target_categories.some((cat) => categoryIds.includes(cat.id));
        if (scopeOverlap) {
          warnings.push(`"${c.title}" (#${c.id}) already discounts an overlapping product/category/branch scope and does not allow stacking.`);
        }
      }
    }

    return warnings;
  }

  private broadcastCampaignUpdate(campaign: any) {
    if (campaign.target_stores && campaign.target_stores.length > 0) {
      campaign.target_stores.forEach((s: any) => {
        this.gateway.server.to(`store_${s.id}`).emit('marketing_update', { campaignId: campaign.id, status: campaign.status });
      });
    } else {
      this.gateway.server.emit('marketing_update', { campaignId: campaign.id, status: campaign.status });
    }
  }

  /** Creates one PENDING CampaignPublication per newly-selected social channel. No posting is performed. */
  private async prepareSocialPublications(campaign: any) {
    const channels: string[] = [];
    if (campaign.published_facebook) channels.push('FACEBOOK');
    if (campaign.published_instagram) channels.push('INSTAGRAM');
    if (channels.length === 0) return;

    const existing = await this.prisma.campaignPublication.findMany({
      where: { campaign_id: campaign.id, channel: { in: channels } },
    });
    const existingChannels = new Set(existing.map((p) => p.channel));
    const toCreate = channels.filter((c) => !existingChannels.has(c));
    if (toCreate.length === 0) return;

    await this.prisma.campaignPublication.createMany({
      data: toCreate.map((channel) => ({ campaign_id: campaign.id, channel, status: 'PENDING' })),
    });
    console.log(`[SOCIAL] Prepared publication record(s) for "${campaign.title}": ${toCreate.join(', ')}`);
  }

  /** MARKETING-003 §10/§20 — one row per lifecycle action, feeds Campaign History + the enterprise audit trail. */
  private async writeAudit(campaignId: number, action: string, meta: AuditMeta = {}, previousValue?: string, newValue?: string) {
    await this.prisma.campaignAuditLog.create({
      data: {
        campaign_id: campaignId,
        user_id: meta.userId ?? null,
        action,
        ip_address: meta.ip ?? null,
        device: meta.device ?? null,
        previous_value: previousValue ?? null,
        new_value: newValue ?? null,
      },
    });
  }

  /** MARKETING-003 §11 — immutable snapshot taken BEFORE an edit is applied, so rollback always has something to restore to. */
  private async snapshotVersion(campaign: any, userId?: number) {
    const {
      audit_logs, versions, target_stores, target_categories, target_products,
      bundle_products, buyProduct, getProduct, giftProduct, cloned_from, clones,
      orders, analytics, publications, brand, ...plain
    } = campaign;
    await this.prisma.campaignVersion.create({
      data: { campaign_id: campaign.id, version: campaign.version, data: plain as any, changed_by: userId ?? null },
    });
  }

  // 1. Digital Marketing SLA Target Logic
  calculateSlaPerformance(
    agencyName: string,
    baselineTarget: number,
    achievedOrders: number,
    retainerFee: number,
  ) {
    const BONUS_PER_EXTRA_ORDER = 150; // Rs. 150 bonus per extra order
    const PENALTY_PCT_FOR_MISSING = 5.0; // 5% penalty on retainer fee

    let finalPayout = retainerFee;
    let status = 'MET';
    let bonusOrPenalty = 0;

    if (achievedOrders > baselineTarget) {
      status = 'EXCEEDED';
      const extraOrders = achievedOrders - baselineTarget;
      bonusOrPenalty = extraOrders * BONUS_PER_EXTRA_ORDER;
      finalPayout += bonusOrPenalty;
    } else if (achievedOrders < baselineTarget) {
      status = 'MISSED';
      bonusOrPenalty = -(retainerFee * (PENALTY_PCT_FOR_MISSING / 100));
      finalPayout += bonusOrPenalty;
    }

    return {
      agency: agencyName,
      status,
      baseline_target: baselineTarget,
      achieved: achievedOrders,
      bonus_penalty_amount: bonusOrPenalty,
      final_payout: finalPayout,
      message:
        status === 'EXCEEDED'
          ? `Great job! Bonus awarded.`
          : status === 'MISSED'
            ? `Target missed. Penalty applied.`
            : `Target exactly met.`,
    };
  }

  // 2. Affiliate Marketing Deep-Link Generator (Influencers/Riders/B2B)
  generateAffiliateLink(
    affiliateId: string,
    storeId: number,
    platform: string,
  ) {
    const baseUrl = `https://order.d4u-pos.com/store/${storeId}`;
    const deepLink = `${baseUrl}?utm_source=affiliate_${platform}&aff_id=${affiliateId}`;

    return {
      affiliate_id: affiliateId,
      platform,
      deep_link: deepLink,
      qr_code_data: deepLink,
      commission_rule: '5% per successful delivery via this link',
    };
  }

  async createCampaign(body: any, meta: AuditMeta = {}) {
    const campaignType = body.campaign_type || 'PERCENTAGE';
    if (campaignType === 'BOGO') {
      await this.validateBogoCampaign(body);
    }

    const normalizedStoreIds = (
      Array.isArray(body.target_store_ids) ? body.target_store_ids : body.target_store_ids ? [body.target_store_ids] : []
    ).map(Number);
    await this.assertCampaignTypeAllowed(campaignType, normalizedStoreIds);

    // brand_id has a schema default of 1 that every caller of this method
    // used to silently inherit -- every campaign in the system ended up
    // tagged to brand 1 ("D4U Enterprise") regardless of which real brand's
    // branches it actually targeted, defeating the brand isolation guard in
    // CampaignResolverService entirely. Resolve it for real: prefer an
    // explicit brand_id from the caller, else infer it from the first
    // targeted store (they're all required to share one brand already via
    // assertCampaignTypeAllowed's store lookups elsewhere in this file).
    let brandId = body.brand_id ? Number(body.brand_id) : undefined;
    if (!brandId && normalizedStoreIds.length > 0) {
      const store = await this.prisma.store.findUnique({ where: { id: normalizedStoreIds[0] }, select: { brand_id: true } });
      brandId = store?.brand_id;
    }
    if (!brandId) {
      throw new BadRequestException('brand_id is required (select at least one branch, or specify a brand) to create a campaign.');
    }

    const warnings = await this.checkConflicts(body);
    const requireApproval = body.require_approval === true || body.require_approval === 'true';

    const campaign = await this.prisma.marketingCampaign.create({
      data: {
        brand_id: brandId,
        title: body.title,
        description: body.description,
        discount_pct: Number(body.discount_pct) || 0,
        image_url: body.image_url || null,
        campaign_type: campaignType,
        flat_discount_amount: body.flat_discount_amount ? Number(body.flat_discount_amount) : null,
        buy_product_id: body.buy_product_id ? Number(body.buy_product_id) : null,
        buy_qty: body.buy_qty ? Number(body.buy_qty) : 1,
        get_product_id: body.get_product_id ? Number(body.get_product_id) : null,
        reward_type: body.reward_type || 'FREE',
        reward_qty: body.reward_qty ? Number(body.reward_qty) : 1,
        bundle_price: body.bundle_price ? Number(body.bundle_price) : null,
        min_spend: body.min_spend ? Number(body.min_spend) : null,
        gift_product_id: body.gift_product_id ? Number(body.gift_product_id) : null,
        active_days: body.active_days || null,
        active_time_start: body.active_time_start || null,
        active_time_end: body.active_time_end || null,
        active_dates: body.active_dates || null,
        show_countdown: body.show_countdown === 'true' || body.show_countdown === true,
        priority: body.priority ? Number(body.priority) : 0,
        allow_stacking: body.allow_stacking === 'true' || body.allow_stacking === true,
        published_pos: body.published_pos === 'true' || body.published_pos === true,
        published_web: body.published_web === 'true' || body.published_web === true,
        published_tv: body.published_tv === 'true' || body.published_tv === true,
        published_qr: body.published_qr === 'true' || body.published_qr === true,
        published_kiosk: body.published_kiosk === 'true' || body.published_kiosk === true,
        published_facebook: body.published_facebook === 'true' || body.published_facebook === true,
        published_instagram: body.published_instagram === 'true' || body.published_instagram === true,
        status: body.schedule_for_later ? 'SCHEDULED' : 'RUNNING',
        scheduled_at: body.schedule_for_later && body.scheduled_at ? new Date(body.scheduled_at) : null,
        end_date: body.schedule_for_later && body.end_date ? new Date(body.end_date) : null,
        created_by: meta.userId ?? null,
        approval_status: requireApproval ? 'PENDING_APPROVAL' : 'APPROVED',
        submitted_by: requireApproval ? meta.userId ?? null : null,
        target_stores: {
          connect: normalizedStoreIds.map((id: any) => ({ id: Number(id) })),
        },
        target_categories: {
          connect: (Array.isArray(body.target_category_ids) ? body.target_category_ids : body.target_category_ids ? [body.target_category_ids] : []).map((id: any) => ({
            id: Number(id),
          })),
        },
        target_products: {
          connect: (Array.isArray(body.target_product_ids) ? body.target_product_ids : body.target_product_ids ? [body.target_product_ids] : []).map((id: any) => ({
            id: Number(id),
          })),
        },
        bundle_products: {
          connect: (Array.isArray(body.bundle_product_ids) ? body.bundle_product_ids : body.bundle_product_ids ? [body.bundle_product_ids] : []).map((id: any) => ({
            id: Number(id),
          })),
        },
      },
      include: {
        target_stores: true,
        target_categories: true,
        target_products: true,
        bundle_products: true,
      },
    });

    // Prepare (not perform) social publishing — one PENDING record per selected
    // channel. Actual posting is a separate integration/job, intentionally not built here.
    await this.prepareSocialPublications(campaign);
    await this.writeAudit(campaign.id, 'CREATED', meta);

    this.broadcastCampaignUpdate(campaign);
    return {
      success: true,
      message:
        campaign.status === 'SCHEDULED'
          ? 'Campaign scheduled successfully'
          : 'Campaign created successfully',
      campaign,
      warnings,
    };
  }

  /** Admin CRUD list — sees everything (including PAUSED/DRAFT/PENDING) except soft-deleted, unless includeArchived is set. */
  // Task #2R-F2a: the store_id-supplied case previously trusted that store's
  // OWN brand_id with no check that it matched the caller's brand at all --
  // any authenticated caller could read another brand's campaigns just by
  // passing a store_id belonging to it. The omitted case was fully
  // unfiltered across every brand. resolveBrandStoreScope now enforces the
  // caller's own active_brand_id in both cases; the existing brand-wide
  // (target_stores: none) OR same-store-match filter is preserved exactly
  // as before whenever store_id is supplied.
  async getCampaigns(store_id?: number, includeArchived = false, authenticatedUser?: any) {
    const { brand_id } = await this.resolveBrandStoreScope(authenticatedUser, store_id);

    const whereClause: any = includeArchived ? {} : { deleted_at: null };
    whereClause.brand_id = brand_id;

    if (store_id) {
      whereClause.OR = [
        { target_stores: { none: {} } },
        { target_stores: { some: { id: store_id } } },
      ];
    }

    return this.prisma.marketingCampaign.findMany({
      where: whereClause,
      include: CAMPAIGN_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * MARKETING-003 §1/§2 — the ONE method every consuming channel (POS,
   * Website, Customer App, Waiter, QR, Kiosk, TV Board, future APIs) must
   * call to know what to actually display. Delegates entirely to
   * CampaignResolverService — no channel re-implements this filtering.
   */
  async getVisibleCampaigns(store_id: number | undefined, channel: MarketingChannel) {
    return this.campaignResolver.resolveVisibleCampaigns({ store_id, channel });
  }

  async updateCampaign(id: number, data: any, meta: AuditMeta = {}) {
    const {
      id: _,
      createdAt,
      updatedAt,
      target_store_ids,
      target_category_ids,
      target_product_ids,
      bundle_product_ids,
      ...updateData
    } = data;
    const updatePayload: any = { ...updateData };

    if (updateData.published_pos !== undefined)
      updatePayload.published_pos = updateData.published_pos === 'true' || updateData.published_pos === true;
    if (updateData.published_web !== undefined)
      updatePayload.published_web = updateData.published_web === 'true' || updateData.published_web === true;
    if (updateData.published_tv !== undefined)
      updatePayload.published_tv = updateData.published_tv === 'true' || updateData.published_tv === true;
    if (updateData.published_facebook !== undefined)
      updatePayload.published_facebook = updateData.published_facebook === 'true' || updateData.published_facebook === true;
    if (updateData.published_instagram !== undefined)
      updatePayload.published_instagram = updateData.published_instagram === 'true' || updateData.published_instagram === true;
    if (updateData.published_qr !== undefined)
      updatePayload.published_qr = updateData.published_qr === 'true' || updateData.published_qr === true;
    if (updateData.published_kiosk !== undefined)
      updatePayload.published_kiosk = updateData.published_kiosk === 'true' || updateData.published_kiosk === true;
    if (updateData.allow_stacking !== undefined)
      updatePayload.allow_stacking = updateData.allow_stacking === 'true' || updateData.allow_stacking === true;
    if (updateData.priority !== undefined) updatePayload.priority = Number(updateData.priority);
    if (updateData.discount_pct !== undefined) updatePayload.discount_pct = Number(updateData.discount_pct);
    if (updateData.flat_discount_amount !== undefined)
      updatePayload.flat_discount_amount = updateData.flat_discount_amount ? Number(updateData.flat_discount_amount) : null;
    if (updateData.buy_product_id !== undefined)
      updatePayload.buy_product_id = updateData.buy_product_id ? Number(updateData.buy_product_id) : null;
    if (updateData.buy_qty !== undefined) updatePayload.buy_qty = Number(updateData.buy_qty);
    if (updateData.get_product_id !== undefined)
      updatePayload.get_product_id = updateData.get_product_id ? Number(updateData.get_product_id) : null;
    if (updateData.reward_qty !== undefined) updatePayload.reward_qty = Number(updateData.reward_qty);
    if (updateData.bundle_price !== undefined)
      updatePayload.bundle_price = updateData.bundle_price ? Number(updateData.bundle_price) : null;
    if (updateData.min_spend !== undefined)
      updatePayload.min_spend = updateData.min_spend ? Number(updateData.min_spend) : null;
    if (updateData.gift_product_id !== undefined)
      updatePayload.gift_product_id = updateData.gift_product_id ? Number(updateData.gift_product_id) : null;
    if (updateData.show_countdown !== undefined)
      updatePayload.show_countdown = updateData.show_countdown === 'true' || updateData.show_countdown === true;
    if (updateData.scheduled_at) updatePayload.scheduled_at = new Date(updateData.scheduled_at);
    if (updateData.end_date) updatePayload.end_date = new Date(updateData.end_date);

    const existingCampaign = await this.prisma.marketingCampaign.findUnique({
      where: { id },
      include: { target_stores: true },
    });
    if (!existingCampaign) throw new BadRequestException('Campaign not found');

    const effectiveType = updatePayload.campaign_type ?? existingCampaign.campaign_type;
    if (effectiveType === 'BOGO') {
      const merged = { ...existingCampaign, ...updateData, ...updatePayload };
      await this.validateBogoCampaign(merged, id);
    }

    const effectiveStoreIds =
      target_store_ids !== undefined
        ? (Array.isArray(target_store_ids) ? target_store_ids : [target_store_ids]).map(Number)
        : (existingCampaign.target_stores || []).map((s) => s.id);
    await this.assertCampaignTypeAllowed(effectiveType, effectiveStoreIds);

    const warnings = await this.checkConflicts(
      { ...existingCampaign, ...updateData, campaign_type: effectiveType, target_store_ids: effectiveStoreIds },
      id,
    );

    // MARKETING-003 §11: snapshot the pre-edit state, then bump the version counter.
    await this.snapshotVersion(existingCampaign);
    updatePayload.version = existingCampaign.version + 1;
    updatePayload.updated_by = meta.userId ?? null;

    if (target_store_ids !== undefined) {
      updatePayload.target_stores = {
        set: (Array.isArray(target_store_ids) ? target_store_ids : target_store_ids ? [target_store_ids] : []).map((id: any) => ({ id: Number(id) })),
      };
    }
    if (target_category_ids !== undefined) {
      updatePayload.target_categories = {
        set: (Array.isArray(target_category_ids) ? target_category_ids : target_category_ids ? [target_category_ids] : []).map((id: any) => ({ id: Number(id) })),
      };
    }
    if (target_product_ids !== undefined) {
      updatePayload.target_products = {
        set: (Array.isArray(target_product_ids) ? target_product_ids : target_product_ids ? [target_product_ids] : []).map((id: any) => ({ id: Number(id) })),
      };
    }
    if (bundle_product_ids !== undefined) {
      updatePayload.bundle_products = {
        set: (Array.isArray(bundle_product_ids) ? bundle_product_ids : bundle_product_ids ? [bundle_product_ids] : []).map((id: any) => ({ id: Number(id) })),
      };
    }

    const campaign = await this.prisma.marketingCampaign.update({
      where: { id },
      data: updatePayload,
      include: {
        target_stores: true,
        target_categories: true,
        target_products: true,
        bundle_products: true,
      },
    });

    await this.prepareSocialPublications(campaign);
    await this.writeAudit(id, 'EDITED', meta, undefined, JSON.stringify(Object.keys(updateData)));
    this.broadcastCampaignUpdate(campaign);
    return { campaign, warnings };
  }

  /** MARKETING-003 §12 — campaigns are never hard-deleted. This archives (soft-delete). */
  async deleteCampaign(id: number, meta: AuditMeta = {}, reason?: string) {
    const campaign = await this.prisma.marketingCampaign.findUnique({
      where: { id },
      include: { target_stores: true },
    });
    if (!campaign) throw new BadRequestException('Campaign not found');

    const archived = await this.prisma.marketingCampaign.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: meta.userId ?? null,
        archived_reason: reason ?? null,
        is_active: false,
        status: 'ARCHIVED',
      },
      include: { target_stores: true },
    });
    await this.writeAudit(id, 'DELETED', meta, undefined, reason);
    this.broadcastCampaignUpdate({ ...archived, status: 'ARCHIVED' });
    return archived;
  }

  async restoreCampaign(id: number, meta: AuditMeta = {}) {
    const restored = await this.prisma.marketingCampaign.update({
      where: { id },
      data: { deleted_at: null, deleted_by: null, archived_reason: null, is_active: true, status: 'PAUSED' },
      include: { target_stores: true },
    });
    await this.writeAudit(id, 'RESTORED', meta);
    this.broadcastCampaignUpdate(restored);
    return restored;
  }

  async pauseCampaign(id: number, meta: AuditMeta = {}) {
    const campaign = await this.prisma.marketingCampaign.update({ where: { id }, data: { status: 'PAUSED' }, include: { target_stores: true } });
    await this.writeAudit(id, 'PAUSED', meta);
    this.broadcastCampaignUpdate(campaign);
    return campaign;
  }

  async resumeCampaign(id: number, meta: AuditMeta = {}) {
    const campaign = await this.prisma.marketingCampaign.update({ where: { id }, data: { status: 'RUNNING' }, include: { target_stores: true } });
    await this.writeAudit(id, 'RESUMED', meta);
    this.broadcastCampaignUpdate(campaign);
    return campaign;
  }

  // MARKETING-003 §15 — Approval Flow (additive: approval_status defaults to
  // APPROVED, so existing campaigns/behavior are unaffected unless a caller
  // explicitly opts into require_approval at creation time).
  async submitForApproval(id: number, meta: AuditMeta = {}) {
    const campaign = await this.prisma.marketingCampaign.update({
      where: { id },
      data: { approval_status: 'PENDING_APPROVAL', submitted_by: meta.userId ?? null },
      include: { target_stores: true },
    });
    await this.writeAudit(id, 'SUBMITTED_FOR_APPROVAL', meta);
    this.broadcastCampaignUpdate(campaign);
    return campaign;
  }

  async approveCampaign(id: number, meta: AuditMeta = {}) {
    const campaign = await this.prisma.marketingCampaign.update({
      where: { id },
      data: { approval_status: 'APPROVED', approved_by: meta.userId ?? null, approved_at: new Date(), rejection_reason: null },
      include: { target_stores: true },
    });
    await this.writeAudit(id, 'APPROVED', meta);
    this.broadcastCampaignUpdate(campaign);
    return campaign;
  }

  async rejectCampaign(id: number, meta: AuditMeta = {}, reason?: string) {
    const campaign = await this.prisma.marketingCampaign.update({
      where: { id },
      data: { approval_status: 'REJECTED', rejection_reason: reason ?? null },
      include: { target_stores: true },
    });
    await this.writeAudit(id, 'REJECTED', meta, undefined, reason);
    this.broadcastCampaignUpdate(campaign);
    return campaign;
  }

  // MARKETING-003 §10/§11 — Campaign History + Versioning/Rollback
  async getCampaignHistory(id: number) {
    const [logs, versions] = await Promise.all([
      this.prisma.campaignAuditLog.findMany({ where: { campaign_id: id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.campaignVersion.findMany({ where: { campaign_id: id }, orderBy: { version: 'desc' } }),
    ]);
    return { logs, versions };
  }

  async rollbackCampaign(id: number, version: number, meta: AuditMeta = {}) {
    const snap = await this.prisma.campaignVersion.findFirst({ where: { campaign_id: id, version } });
    if (!snap) throw new BadRequestException(`Version ${version} not found for campaign #${id}`);
    const current = await this.prisma.marketingCampaign.findUnique({ where: { id } });
    if (!current) throw new BadRequestException('Campaign not found');

    await this.snapshotVersion(current, meta.userId);

    const data = snap.data as any;
    const { id: _id, createdAt, ...restoreFields } = data;

    const updated = await this.prisma.marketingCampaign.update({
      where: { id },
      data: { ...restoreFields, version: current.version + 1, updated_by: meta.userId ?? null },
      include: { target_stores: true },
    });
    await this.writeAudit(id, 'ROLLED_BACK', meta, undefined, JSON.stringify({ toVersion: version }));
    this.broadcastCampaignUpdate(updated);
    return updated;
  }

  // MARKETING-003 §16 — Multi-Branch Cloning (gated by package entitlement per target store)
  async cloneCampaign(id: number, targetStoreIds: number[] | 'ALL', meta: AuditMeta = {}) {
    const source = await this.prisma.marketingCampaign.findUnique({
      where: { id },
      include: { target_categories: true, target_products: true, bundle_products: true },
    });
    if (!source) throw new BadRequestException('Campaign not found');

    // Task #2R-F2a: 'ALL' previously resolved to every store across every
    // brand in the database. #2R-F2-D established -- from the frontend's own
    // "Clone to this branch" label and the enterprise multi-branch-cloning
    // intent behind this route -- that 'ALL' means every store in the SOURCE
    // campaign's own brand, never a cross-brand operation. Explicit target
    // store ids are now validated against that same boundary; ownership of
    // the clone itself is unchanged (still brand_id: source.brand_id below).
    let storeIds: number[];
    if (targetStoreIds === 'ALL') {
      const brandStores = await this.prisma.store.findMany({
        where: { brand_id: source.brand_id, deleted_at: null },
        select: { id: true },
      });
      storeIds = brandStores.map((s) => s.id);
    } else {
      const uniqueRequestedIds = Array.from(new Set(targetStoreIds));
      const validCount = await this.prisma.store.count({
        where: { id: { in: uniqueRequestedIds }, brand_id: source.brand_id },
      });
      if (validCount !== uniqueRequestedIds.length) {
        throw new BadRequestException("One or more target stores do not belong to this campaign's brand.");
      }
      storeIds = targetStoreIds;
    }

    await this.assertCampaignTypeAllowed(source.campaign_type, storeIds);

    const clone = await this.prisma.marketingCampaign.create({
      data: {
        brand_id: source.brand_id,
        title: `${source.title} (Copy)`,
        description: source.description,
        discount_pct: source.discount_pct,
        image_url: source.image_url,
        campaign_type: source.campaign_type,
        flat_discount_amount: source.flat_discount_amount,
        buy_product_id: source.buy_product_id,
        buy_qty: source.buy_qty,
        get_product_id: source.get_product_id,
        reward_type: source.reward_type,
        reward_qty: source.reward_qty,
        bundle_price: source.bundle_price,
        min_spend: source.min_spend,
        gift_product_id: source.gift_product_id,
        active_days: source.active_days,
        active_time_start: source.active_time_start,
        active_time_end: source.active_time_end,
        active_dates: source.active_dates,
        show_countdown: source.show_countdown,
        priority: source.priority,
        allow_stacking: source.allow_stacking,
        published_pos: source.published_pos,
        published_web: source.published_web,
        published_tv: source.published_tv,
        published_qr: source.published_qr,
        published_kiosk: source.published_kiosk,
        status: 'PAUSED', // safe default — admin must explicitly resume a cloned campaign
        approval_status: 'APPROVED',
        created_by: meta.userId ?? null,
        cloned_from_id: source.id,
        target_stores: { connect: storeIds.map((sid) => ({ id: sid })) },
        target_categories: { connect: source.target_categories.map((c) => ({ id: c.id })) },
        target_products: { connect: source.target_products.map((p) => ({ id: p.id })) },
        bundle_products: { connect: source.bundle_products.map((p) => ({ id: p.id })) },
      },
      include: { target_stores: true },
    });

    await this.writeAudit(clone.id, 'CLONED', meta, undefined, `from campaign #${source.id}`);
    this.broadcastCampaignUpdate(clone);
    return clone;
  }

  // MARKETING-003 §17 — Import / Export
  // Task #2R-F2a: previously had NO brand check at all, even when store_id
  // was supplied (only filtered by target_stores, never verified store
  // ownership), and the omitted case was a fully unfiltered cross-brand
  // dump -- worse than getCampaigns' pre-fix gap. resolveBrandStoreScope now
  // enforces the caller's own active_brand_id in both cases.
  async exportCampaignsJson(store_id?: number, authenticatedUser?: any) {
    const { brand_id } = await this.resolveBrandStoreScope(authenticatedUser, store_id);
    const where: any = { deleted_at: null, brand_id };
    if (store_id) where.OR = [{ target_stores: { none: {} } }, { target_stores: { some: { id: store_id } } }];
    return this.prisma.marketingCampaign.findMany({
      where,
      include: { target_stores: true, target_categories: true, target_products: true },
    });
  }

  async exportCampaignsCsv(store_id?: number, authenticatedUser?: any): Promise<string> {
    const campaigns = await this.exportCampaignsJson(store_id, authenticatedUser);
    const headers = [
      'id', 'title', 'campaign_type', 'discount_pct', 'flat_discount_amount', 'status',
      'priority', 'published_pos', 'published_web', 'published_tv', 'allow_stacking', 'end_date',
    ];
    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const rows = campaigns.map((c: any) => headers.map((h) => escape(c[h])).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  async importCampaignsJson(items: any[], meta: AuditMeta = {}) {
    const created: any[] = [];
    for (const item of items) {
      const result = await this.createCampaign(item, meta);
      created.push(result.campaign);
    }
    return { imported: created.length, campaigns: created };
  }

  async importCampaignsCsv(csvText: string, meta: AuditMeta = {}) {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return { imported: 0, campaigns: [] };
    const headers = lines[0].split(',').map((h) => h.trim());
    const items = lines.slice(1).map((line) => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = values[i]?.trim(); });
      return obj;
    });
    return this.importCampaignsJson(items, meta);
  }

  // 5. Create Scheduled Discount
  async createScheduledDiscount(body: any) {
    if (!body.brand_id) {
      throw new BadRequestException('brand_id is required to create a scheduled discount.');
    }
    return this.prisma.scheduledDiscount.create({
      data: {
        brand_id: body.brand_id,
        title: body.title,
        discount_pct: Number(body.discount_pct),
        image_url: body.image_url || null,
        target_category_id: body.target_category_id ? Number(body.target_category_id) : null,
        target_product_id: body.target_product_id ? Number(body.target_product_id) : null,
        start_date: new Date(body.start_date),
        end_date: new Date(body.end_date),
        target_stores: body.target_stores || 'ALL',
      },
    });
  }

  // 6. Get Scheduled Discounts
  async getScheduledDiscounts() {
    return this.prisma.scheduledDiscount.findMany({
      where: { is_active: true },
      orderBy: { start_date: 'asc' },
    });
  }

  async updateScheduledDiscount(id: number, data: any) {
    const { id: _, createdAt, updatedAt, ...updateData } = data;

    if (updateData.start_date) updateData.start_date = new Date(updateData.start_date);
    if (updateData.end_date) updateData.end_date = new Date(updateData.end_date);
    if (updateData.discount_pct) updateData.discount_pct = Number(updateData.discount_pct);

    return this.prisma.scheduledDiscount.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteScheduledDiscount(id: number) {
    return this.prisma.scheduledDiscount.delete({
      where: { id },
    });
  }

  // 7. CRON Automation: Triggers every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledDiscounts() {
    const now = new Date();

    const activeSchedules = await this.prisma.scheduledDiscount.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
    });

    for (const sched of activeSchedules) {
      const existing = await this.prisma.marketingCampaign.findFirst({
        where: { title: `[AUTO] ${sched.title}` },
      });

      if (!existing) {
        console.log(`[CRON] Auto-activating Scheduled Discount: ${sched.title}`);
        await this.createCampaign({
          title: `[AUTO] ${sched.title}`,
          description: `Automatically scheduled discount of ${sched.discount_pct}%`,
          discount_pct: sched.discount_pct,
          published_pos: true,
          published_web: true,
          published_social: true,
        });

        console.log(`[CRON] Posted Scheduled Deal to Facebook/Instagram: ${sched.title}`);
      }
    }

    await this.prisma.scheduledDiscount.updateMany({
      where: {
        is_active: true,
        end_date: { lt: now },
      },
      data: { is_active: false },
    });

    // Handle new MarketingCampaign scheduled publishes
    const scheduledCampaigns = await this.prisma.marketingCampaign.findMany({
      where: {
        status: 'SCHEDULED',
        deleted_at: null,
        scheduled_at: { lte: now },
      },
      include: { target_stores: true },
    });

    for (const campaign of scheduledCampaigns) {
      console.log(`[CRON] Auto-publishing Scheduled Campaign: ${campaign.title}`);
      await this.prisma.marketingCampaign.update({
        where: { id: campaign.id },
        data: { status: 'RUNNING' },
      });
      await this.writeAudit(campaign.id, 'PUBLISHED', {});
      this.broadcastCampaignUpdate({ ...campaign, status: 'RUNNING' });
    }

    // Auto-expire MarketingCampaigns
    const runningCampaigns = await this.prisma.marketingCampaign.findMany({
      where: {
        status: 'RUNNING',
        deleted_at: null,
        end_date: { lt: now },
      },
      include: { target_stores: true },
    });

    for (const campaign of runningCampaigns) {
      console.log(`[CRON] Auto-expiring MarketingCampaign: ${campaign.title}`);
      await this.prisma.marketingCampaign.update({
        where: { id: campaign.id },
        data: { status: 'EXPIRED', is_active: false },
      });
      await this.writeAudit(campaign.id, 'EXPIRED', {});
      this.broadcastCampaignUpdate({ ...campaign, status: 'EXPIRED' });
    }
  }

  // 8. Analytics Telemetry
  async trackAnalytics(id: number, event: string, revenue?: number) {
    const eventColumn: Record<string, string> = {
      view: 'views',
      impression: 'impressions',
      menu_open: 'menu_opens',
      product_click: 'product_clicks',
      offer_click: 'offer_clicks',
      cart_add: 'cart_adds',
      order_generated: 'orders_generated',
      blocked_coupon: 'blocked_coupons',
      blocked_loyalty: 'blocked_loyalty',
    };
    const column = eventColumn[event];
    if (!column) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateData: any = {
      [column]: { increment: 1 },
    };

    if (event === 'order_generated' && revenue) {
      updateData.revenue_generated = { increment: revenue };
    }

    const createData: any = {
      campaign_id: id,
      date: today,
    };
    createData[column] = 1;
    if (event === 'order_generated' && revenue) {
      createData.revenue_generated = revenue;
    }

    return this.prisma.campaignAnalytics.upsert({
      where: {
        campaign_date_hour_store: {
          campaign_id: id,
          date: today,
          hour: 0,
          store_id: 0,
        },
      },
      update: updateData,
      create: { ...createData, hour: 0, store_id: 0 },
    });
  }

  /** Resolves the named date-range presets used by the Marketing Overview filters. */
  static resolveDateRange(preset?: string, from?: string, to?: string): { start: Date; end: Date } {
    const now = new Date();
    const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
    const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

    switch (preset) {
      case 'yesterday': {
        const y = addDays(now, -1);
        return { start: startOfDay(y), end: endOfDay(y) };
      }
      case 'this_week': {
        const day = now.getDay();
        const monday = addDays(now, day === 0 ? -6 : 1 - day);
        return { start: startOfDay(monday), end: endOfDay(now) };
      }
      case 'last_week': {
        const day = now.getDay();
        const thisMonday = addDays(now, day === 0 ? -6 : 1 - day);
        const lastMonday = addDays(thisMonday, -7);
        const lastSunday = addDays(thisMonday, -1);
        return { start: startOfDay(lastMonday), end: endOfDay(lastSunday) };
      }
      case 'last_7_days': {
        return { start: startOfDay(addDays(now, -6)), end: endOfDay(now) };
      }
      case 'this_month': {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfDay(first), end: endOfDay(now) };
      }
      case 'last_month': {
        const firstOfThis = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastOfLast = addDays(firstOfThis, -1);
        return { start: startOfDay(firstOfLast), end: endOfDay(lastOfLast) };
      }
      case 'custom':
        return {
          start: from ? startOfDay(new Date(from)) : startOfDay(now),
          end: to ? endOfDay(new Date(to)) : endOfDay(now),
        };
      case 'today':
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  }

  async getKPIs(params: { preset?: string; from?: string; to?: string } = {}) {
    const { start, end } = MarketingService.resolveDateRange(params.preset, params.from, params.to);

    const analytics = await this.prisma.campaignAnalytics.findMany({
      where: { date: { gte: start, lte: end } },
    });
    let totalViews = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let blockedCoupons = 0;
    let blockedLoyalty = 0;
    for (const row of analytics) {
      totalViews += row.views;
      totalImpressions += row.impressions;
      totalClicks += row.offer_clicks;
      blockedCoupons += row.blocked_coupons;
      blockedLoyalty += row.blocked_loyalty;
    }

    const promotedOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: 'VOIDED' },
        promotion_id: { not: null },
      },
      include: {
        items: { include: { product: { include: { categories: true } } } },
        promotion: true,
      },
    });

    let totalOrders = promotedOrders.length;
    let totalRevenue = 0;
    let totalDiscount = 0;
    let unitsSold = 0;
    let bogoRedemptions = 0;
    let bundleSales = 0;
    let comboSales = 0;
    let freeGiftsGiven = 0;
    let couponUsage = 0;

    const revenueByCampaign = new Map<number, { title: string; revenue: number; orders: number }>();
    const qtyByProduct = new Map<number, { name: string; qty: number }>();
    const qtyByCategory = new Map<number, { name: string; qty: number }>();
    const ordersByBogoCampaign = new Map<number, { title: string; orders: number }>();
    const customerOrderCounts = new Map<number, number>();

    for (const order of promotedOrders) {
      totalRevenue += order.total_amount;
      totalDiscount += order.promotion_discount || 0;
      if (order.bogo_items) { bogoRedemptions++; }
      if (order.bundle_id) bundleSales++;
      if (order.combo_id) comboSales++;
      if (order.gift_items) {
        const gifts = order.gift_items as any[];
        freeGiftsGiven += gifts.reduce((s, g) => s + (g.qty || 1), 0);
      }
      if (order.order_source === 'ONLINE') couponUsage++;
      if (order.customer_id) customerOrderCounts.set(order.customer_id, (customerOrderCounts.get(order.customer_id) || 0) + 1);

      for (const item of order.items) {
        unitsSold += item.quantity;
        const p = qtyByProduct.get(item.product_id) || { name: item.product?.name || `#${item.product_id}`, qty: 0 };
        p.qty += item.quantity;
        qtyByProduct.set(item.product_id, p);

        const category = item.product?.categories?.[0];
        if (category) {
          const c = qtyByCategory.get(category.id) || { name: category.name, qty: 0 };
          c.qty += item.quantity;
          qtyByCategory.set(category.id, c);
        }
      }

      if (order.promotion_id) {
        const entry = revenueByCampaign.get(order.promotion_id) || { title: order.promotion_name || '', revenue: 0, orders: 0 };
        entry.revenue += order.total_amount;
        entry.orders += 1;
        revenueByCampaign.set(order.promotion_id, entry);

        if (order.promotion_type === 'BOGO') {
          const bogoEntry = ordersByBogoCampaign.get(order.promotion_id) || { title: order.promotion_name || '', orders: 0 };
          bogoEntry.orders += 1;
          ordersByBogoCampaign.set(order.promotion_id, bogoEntry);
        }
      }
    }

    const activeCampaigns = await this.prisma.marketingCampaign.count({ where: { status: 'RUNNING', deleted_at: null } });

    // MARKETING-003 §18 — dashboard additions: needs the full (non-promoted)
    // order population in the same window to compute redemption% and revenue lift.
    const [allOrdersAgg, nonPromoAgg] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: { not: 'VOIDED' } },
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: { not: 'VOIDED' }, promotion_id: null },
        _avg: { total_amount: true },
      }),
    ]);
    const totalOrdersAllChannels = allOrdersAgg._count._all;
    const redemptionPct = totalOrdersAllChannels > 0 ? (totalOrders / totalOrdersAllChannels) * 100 : 0;
    const nonPromoAvg = nonPromoAgg._avg.total_amount || 0;

    const topCampaignEntry = [...revenueByCampaign.entries()].sort((a, b) => b[1].revenue - a[1].revenue)[0];
    const worstCampaignEntry = [...revenueByCampaign.entries()].sort((a, b) => a[1].revenue - b[1].revenue)[0];
    const topProductEntry = [...qtyByProduct.values()].sort((a, b) => b.qty - a.qty)[0];
    const topCategoryEntry = [...qtyByCategory.values()].sort((a, b) => b.qty - a.qty)[0];
    const topBogoEntry = [...ordersByBogoCampaign.entries()].sort((a, b) => b[1].orders - a[1].orders)[0];
    const repeatCustomers = [...customerOrderCounts.values()].filter((c) => c > 1).length;

    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const roi = totalDiscount > 0 ? parseFloat((totalRevenue / totalDiscount).toFixed(2)) : 0;
    const averageDiscount = totalOrders > 0 ? totalDiscount / totalOrders : 0;
    const revenueLift = aov - nonPromoAvg;

    return {
      range: { start, end },
      activeCampaigns,
      impressions: totalImpressions,
      orders: totalOrders,
      revenue: parseFloat(totalRevenue.toFixed(2)),
      unitsSold,
      discountGiven: parseFloat(totalDiscount.toFixed(2)),
      averageOrderValue: parseFloat(aov.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      ctr: parseFloat(ctr.toFixed(2)),
      roi,
      topCampaign: topCampaignEntry ? { id: topCampaignEntry[0], title: topCampaignEntry[1].title, revenue: parseFloat(topCampaignEntry[1].revenue.toFixed(2)) } : null,
      topCategory: topCategoryEntry?.name || null,
      topProduct: topProductEntry?.name || null,
      bogo: {
        orders: bogoRedemptions,
        freeItemsIssued: promotedOrders.reduce((s, o) => s + (o.bogo_items ? (o.bogo_items as any[]).reduce((s2, b) => s2 + (b.rewardUnits || 0), 0) : 0), 0),
        rewardValue: parseFloat(promotedOrders.filter((o) => o.promotion_type === 'BOGO').reduce((s, o) => s + (o.promotion_discount || 0), 0).toFixed(2)),
        topCampaign: topBogoEntry ? { id: topBogoEntry[0], title: topBogoEntry[1].title } : null,
      },
      promotions: {
        bundleSales,
        comboSales,
        freeGiftsGiven,
        couponUsage,
        blockedCoupons,
        blockedLoyalty,
      },
      // MARKETING-003 §18 — dashboard hardening additions
      dashboard: {
        worstCampaign: worstCampaignEntry ? { id: worstCampaignEntry[0], title: worstCampaignEntry[1].title, revenue: parseFloat(worstCampaignEntry[1].revenue.toFixed(2)) } : null,
        averageDiscount: parseFloat(averageDiscount.toFixed(2)),
        averageBasketIncrease: parseFloat(revenueLift.toFixed(2)),
        revenueLift: parseFloat(revenueLift.toFixed(2)),
        repeatCustomers,
        redemptionPct: parseFloat(redemptionPct.toFixed(2)),
      },
      // Backward-compatible fields for any existing consumer of the old shape:
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      aov: parseFloat(aov.toFixed(2)),
    };
  }
}
