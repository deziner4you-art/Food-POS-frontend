import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppGateway } from '../../../app.gateway';

@Injectable()
export class MarketingService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  private broadcastCampaignUpdate(campaign: any) {
    if (campaign.target_stores && campaign.target_stores.length > 0) {
      campaign.target_stores.forEach((s: any) => {
        this.gateway.server.to(`store_${s.id}`).emit('marketing_update', { campaignId: campaign.id, status: campaign.status });
      });
    } else {
      this.gateway.server.emit('marketing_update', { campaignId: campaign.id, status: campaign.status });
    }
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
    // Generates UTM tagged Deep-Link that automatically tracks conversions
    const baseUrl = `https://order.d4u-pos.com/store/${storeId}`;
    const deepLink = `${baseUrl}?utm_source=affiliate_${platform}&aff_id=${affiliateId}`;

    return {
      affiliate_id: affiliateId,
      platform,
      deep_link: deepLink,
      qr_code_data: deepLink, // Frontend generates the actual visual QR code from this string
      commission_rule: '5% per successful delivery via this link',
    };
  }

  async createCampaign(body: any) {
    const campaign = await this.prisma.marketingCampaign.create({
      data: {
        title: body.title,
        description: body.description,
        discount_pct: Number(body.discount_pct),
        image_url: body.image_url || null,
        published_pos:
          body.published_pos === 'true' || body.published_pos === true,
        published_web:
          body.published_web === 'true' || body.published_web === true,
        published_tv:
          body.published_tv === 'true' || body.published_tv === true,
        published_facebook:
          body.published_facebook === 'true' ||
          body.published_facebook === true,
        published_instagram:
          body.published_instagram === 'true' ||
          body.published_instagram === true,
        status: body.schedule_for_later ? 'SCHEDULED' : 'RUNNING',
        scheduled_at:
          body.schedule_for_later && body.scheduled_at
            ? new Date(body.scheduled_at)
            : null,
        end_date:
          body.schedule_for_later && body.end_date
            ? new Date(body.end_date)
            : null,
        target_stores: {
          connect: (Array.isArray(body.target_store_ids) ? body.target_store_ids : body.target_store_ids ? [body.target_store_ids] : []).map((id: any) => ({
            id: Number(id),
          })),
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
      },
      include: {
        target_stores: true,
        target_categories: true,
        target_products: true,
      },
    });

    let fbSuccess = false;
    let igSuccess = false;

    // Trigger Social Media Posting if active now
    if (campaign.status === 'active') {
      if (
        body.published_facebook === 'true' ||
        body.published_facebook === true
      ) {
        try {
          console.log(
            `[SOCIAL MEDIA] Publishing "${campaign.title}" to Facebook Graph API.`,
          );
          fbSuccess = true; // Simulated success
        } catch (e) {
          console.error('FB error', e);
        }
      }

      if (
        body.published_instagram === 'true' ||
        body.published_instagram === true
      ) {
        try {
          console.log(
            `[SOCIAL MEDIA] Publishing "${campaign.title}" to Instagram Graph API.`,
          );
          igSuccess = true; // Simulated success
        } catch (e) {
          console.error('IG error', e);
        }
      }

      if (fbSuccess || igSuccess) {
        await this.prisma.marketingCampaign.update({
          where: { id: campaign.id },
          data: {
            published_facebook: fbSuccess,
            published_instagram: igSuccess,
          },
        });
        campaign.published_facebook = fbSuccess;
        campaign.published_instagram = igSuccess;
      }
    }

    this.broadcastCampaignUpdate(campaign);
    return {
      success: true,
      message:
        campaign.status === 'SCHEDULED'
          ? 'Campaign scheduled successfully'
          : 'Campaign created successfully',
      campaign,
    };
  }

  // 4. Get Active Campaigns
  async getCampaigns(store_id?: number) {
    const whereClause: any = { is_active: true };

    if (store_id) {
      whereClause.OR = [
        { target_stores: { none: {} } },
        { target_stores: { some: { id: store_id } } },
      ];
    }

    return this.prisma.marketingCampaign.findMany({
      where: whereClause,
      include: {
        target_stores: true,
        target_categories: true,
        target_products: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCampaign(id: number, data: any) {
    const {
      id: _,
      createdAt,
      updatedAt,
      target_store_ids,
      target_category_ids,
      target_product_ids,
      ...updateData
    } = data;
    const updatePayload: any = { ...updateData };

    if (updateData.published_pos !== undefined)
      updatePayload.published_pos =
        updateData.published_pos === 'true' ||
        updateData.published_pos === true;
    if (updateData.published_web !== undefined)
      updatePayload.published_web =
        updateData.published_web === 'true' ||
        updateData.published_web === true;
    if (updateData.published_tv !== undefined)
      updatePayload.published_tv =
        updateData.published_tv === 'true' || updateData.published_tv === true;
    if (updateData.published_facebook !== undefined)
      updatePayload.published_facebook =
        updateData.published_facebook === 'true' ||
        updateData.published_facebook === true;
    if (updateData.published_instagram !== undefined)
      updatePayload.published_instagram =
        updateData.published_instagram === 'true' ||
        updateData.published_instagram === true;
    if (updateData.discount_pct !== undefined)
      updatePayload.discount_pct = Number(updateData.discount_pct);
    if (updateData.scheduled_at)
      updatePayload.scheduled_at = new Date(updateData.scheduled_at);
    if (updateData.end_date)
      updatePayload.end_date = new Date(updateData.end_date);

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

    return this.prisma.marketingCampaign.update({
      where: { id },
      data: updatePayload,
      include: {
        target_stores: true,
        target_categories: true,
        target_products: true,
      },
    });
  }

  async deleteCampaign(id: number) {
    return this.prisma.marketingCampaign.delete({
      where: { id },
    });
  }

  // 5. Create Scheduled Discount
  async createScheduledDiscount(body: any) {
    return this.prisma.scheduledDiscount.create({
      data: {
        brand_id: body.brand_id || 1,
        title: body.title,
        discount_pct: Number(body.discount_pct),
        image_url: body.image_url || null,
        target_category_id: body.target_category_id
          ? Number(body.target_category_id)
          : null,
        target_product_id: body.target_product_id
          ? Number(body.target_product_id)
          : null,
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

    // Parse dates if they exist in update
    if (updateData.start_date)
      updateData.start_date = new Date(updateData.start_date);
    if (updateData.end_date)
      updateData.end_date = new Date(updateData.end_date);
    if (updateData.discount_pct)
      updateData.discount_pct = Number(updateData.discount_pct);

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

    // Find discounts that should start NOW and haven't been pushed to MarketingCampaign
    // Actually, a better logic is: Find active scheduled discounts, see if they are active now.
    // If they just started, create a campaign for them if not already created.
    // For simplicity, let's just log them as if we trigger a campaign.

    const activeSchedules = await this.prisma.scheduledDiscount.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
    });

    for (const sched of activeSchedules) {
      // Check if campaign already exists for this schedule
      const existing = await this.prisma.marketingCampaign.findFirst({
        where: { title: `[AUTO] ${sched.title}` },
      });

      if (!existing) {
        console.log(
          `[CRON] Auto-activating Scheduled Discount: ${sched.title}`,
        );
        await this.createCampaign({
          title: `[AUTO] ${sched.title}`,
          description: `Automatically scheduled discount of ${sched.discount_pct}%`,
          discount_pct: sched.discount_pct,
          published_pos: true,
          published_web: true,
          published_social: true,
        });

        // Push notification (simulate)
        console.log(
          `[CRON] Posted Scheduled Deal to Facebook/Instagram: ${sched.title}`,
        );
      }
    }

    // Also, mark expired as inactive
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
        scheduled_at: { lte: now },
      },
      include: { target_stores: true }
    });

    for (const campaign of scheduledCampaigns) {
      console.log(`[CRON] Auto-publishing Scheduled Campaign: ${campaign.title}`);
      await this.prisma.marketingCampaign.update({
        where: { id: campaign.id },
        data: { status: 'RUNNING' },
      });
      this.broadcastCampaignUpdate({ ...campaign, status: 'RUNNING' });
    }

    // Auto-expire MarketingCampaigns
    const runningCampaigns = await this.prisma.marketingCampaign.findMany({
      where: {
        status: 'RUNNING',
        end_date: { lt: now },
      },
      include: { target_stores: true }
    });

    for (const campaign of runningCampaigns) {
      console.log(`[CRON] Auto-expiring MarketingCampaign: ${campaign.title}`);
      await this.prisma.marketingCampaign.update({
        where: { id: campaign.id },
        data: { status: 'EXPIRED', is_active: false },
      });
      this.broadcastCampaignUpdate({ ...campaign, status: 'EXPIRED' });
    }
  }

  // 8. Analytics Telemetry
  async trackAnalytics(id: number, event: string, revenue?: number) {
    const validEvents = ['view', 'impression', 'menu_open', 'product_click', 'offer_click', 'cart_add', 'order_generated'];
    if (!validEvents.includes(event)) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateData: any = {
      [event + 's']: { increment: 1 }
    };

    if (event === 'order_generated' && revenue) {
      updateData.revenue_generated = { increment: revenue };
    }

    const createData: any = {
      campaign_id: id,
      date: today
    };
    createData[event + 's'] = 1;
    if (event === 'order_generated' && revenue) {
      createData.revenue_generated = revenue;
    }

    return this.prisma.campaignAnalytics.upsert({
      where: { 
        campaign_date_hour_store: { 
          campaign_id: id, 
          date: today,
          hour: 0, // Using 0 as default placeholder for existing non-hourly logic
          store_id: 0, // Using 0 as default placeholder for existing non-store logic
        } 
      },
      update: updateData,
      create: { ...createData, hour: 0, store_id: 0 }
    });
  }

  async getKPIs() {
    const analytics = await this.prisma.campaignAnalytics.findMany();
    
    let totalViews = 0;
    let totalClicks = 0;
    let totalOrders = 0;
    let totalRevenue = 0;

    for (const row of analytics) {
      totalViews += row.views;
      totalClicks += row.offer_clicks;
      totalOrders += row.orders_generated;
      totalRevenue += row.revenue_generated;
    }

    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
    const aov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    return {
      ctr: parseFloat(ctr.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      totalRevenue: totalRevenue,
      totalOrders: totalOrders,
      aov: parseFloat(aov.toFixed(2)),
      roi: 0 // Placeholder
    };
  }
}
