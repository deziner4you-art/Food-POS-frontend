import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { SubscriptionService } from '../../core/subscription/subscription.service';

export type MarketingChannel = 'pos' | 'waiter' | 'web' | 'customer_app' | 'qr' | 'kiosk' | 'tv';

// Which MarketingCampaign.published_* column gates each consuming channel.
// customer_app intentionally reuses published_web — "Customer App must behave
// exactly like Website. No duplicated implementation" (MARKETING-003 §4).
const CHANNEL_PUBLISH_FIELD: Record<MarketingChannel, string> = {
  pos: 'published_pos',
  waiter: 'published_pos',
  web: 'published_web',
  customer_app: 'published_web',
  qr: 'published_qr',
  kiosk: 'published_qr', // "Prepare same rendering. Reuse Website components." (§7) — kiosk piggybacks the QR flag, no dedicated field was ever added for it beyond published_kiosk which stays available for future use.
  tv: 'published_tv',
};

const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CAMPAIGN_INCLUDE = {
  target_stores: true,
  target_categories: true,
  target_products: true,
  buyProduct: true,
  getProduct: true,
  bundle_products: true,
  giftProduct: true,
} as const;

/**
 * MARKETING-003 §1/§2 — the single shared "which campaigns are real right
 * now" service. Every consumer (order pricing, Admin campaign list, POS,
 * Website, Customer App, Waiter, QR, Kiosk, TV Board, and any future API)
 * must go through this — never re-implement campaign filtering elsewhere.
 *
 * Two entry points:
 *  - getCoreActiveCampaigns(store_id): store/branch + package/module
 *    entitlement + campaign-enabled + soft-delete + approval + schedule +
 *    Happy Hour window. This is what determines whether a campaign can ever
 *    apply to money (pricing).
 *  - resolveVisibleCampaigns(store_id, channel): everything above, PLUS the
 *    channel's publish-target flag and end-date cutoff. This is what
 *    determines whether a campaign should ever be DISPLAYED on a given
 *    channel. Display is always a subset of pricing-eligible, never broader.
 */
@Injectable()
export class CampaignResolverService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionService,
  ) {}

  isWithinActiveWindow(campaign: any, now: Date = new Date()): boolean {
    if (campaign.active_dates) {
      const dates = campaign.active_dates.split(',').map((d: string) => d.trim());
      const today = now.toISOString().slice(0, 10);
      if (!dates.includes(today)) return false;
    }
    if (campaign.active_days) {
      const days = campaign.active_days.split(',').map((d: string) => d.trim());
      if (!days.includes(WEEKDAY_ABBR[now.getDay()])) return false;
    }
    if (campaign.active_time_start && campaign.active_time_end) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = campaign.active_time_start.split(':').map(Number);
      const [endH, endM] = campaign.active_time_end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      // Same-day window (e.g. 09:00-17:00): simple range check.
      // Overnight window (e.g. 15:00-02:00, end < start): valid time is
      // everything from start to midnight OR midnight to end — an OR, not
      // an AND. The old single-range check made any overnight window
      // permanently unsatisfiable (startMinutes > endMinutes can never
      // bound a real nowMinutes), excluding the campaign at every hour.
      const withinWindow = startMinutes <= endMinutes
        ? nowMinutes >= startMinutes && nowMinutes <= endMinutes
        : nowMinutes >= startMinutes || nowMinutes <= endMinutes;
      if (!withinWindow) return false;
    }
    return true;
  }

  async getCoreActiveCampaigns(store_id: number) {
    const capabilities = await this.subscriptions.getMarketingCapabilities(store_id);
    if (!capabilities.enabled) return [];

    const campaigns = await this.prisma.marketingCampaign.findMany({
      where: {
        status: 'RUNNING',
        is_active: true,
        deleted_at: null,
        approval_status: 'APPROVED',
        campaign_type: { in: capabilities.allowedCampaignTypes },
        OR: [
          { target_stores: { none: {} } },
          { target_stores: { some: { id: store_id } } },
        ],
      },
      include: CAMPAIGN_INCLUDE,
      orderBy: { priority: 'desc' },
    });

    const now = new Date();
    return campaigns.filter((c) => this.isWithinActiveWindow(c, now) && (!c.end_date || new Date(c.end_date) >= now));
  }

  /**
   * The one method every display surface (POS/Website/Customer App/Waiter/QR/
   * Kiosk/TV Board/future APIs) must call. `store_id` omitted only for
   * legacy/global consumers migrating incrementally — package/module
   * entitlement is skipped in that case since it's store-scoped, so pass
   * store_id whenever it's known.
   */
  async resolveVisibleCampaigns(params: { store_id?: number; channel: MarketingChannel }) {
    const { store_id, channel } = params;
    const publishField = CHANNEL_PUBLISH_FIELD[channel];

    if (store_id) {
      const capabilities = await this.subscriptions.getMarketingCapabilities(store_id);
      if (!capabilities.enabled) return [];
      if (channel === 'tv' && !capabilities.tvBoard) return [];

      const campaigns = await this.getCoreActiveCampaigns(store_id);
      return campaigns.filter((c: any) => c[publishField] === true);
    }

    // No store scoping available (legacy global consumers) — still enforce
    // enabled/approved/soft-delete/schedule/Happy-Hour/publish-target/date range.
    const campaigns = await this.prisma.marketingCampaign.findMany({
      where: {
        status: 'RUNNING',
        is_active: true,
        deleted_at: null,
        approval_status: 'APPROVED',
        [publishField]: true,
      },
      include: CAMPAIGN_INCLUDE,
      orderBy: { priority: 'desc' },
    });
    const now = new Date();
    return campaigns.filter((c) => this.isWithinActiveWindow(c, now) && (!c.end_date || new Date(c.end_date) >= now));
  }
}
