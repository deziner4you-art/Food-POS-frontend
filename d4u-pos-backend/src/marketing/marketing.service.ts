import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}
  
  // 1. Digital Marketing SLA Target Logic
  calculateSlaPerformance(agencyName: string, baselineTarget: number, achievedOrders: number, retainerFee: number) {
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
      message: status === 'EXCEEDED' ? `Great job! Bonus awarded.` : (status === 'MISSED' ? `Target missed. Penalty applied.` : `Target exactly met.`)
    };
  }

  // 2. Affiliate Marketing Deep-Link Generator (Influencers/Riders/B2B)
  generateAffiliateLink(affiliateId: string, storeId: number, platform: string) {
    // Generates UTM tagged Deep-Link that automatically tracks conversions
    const baseUrl = `https://order.d4u-pos.com/store/${storeId}`;
    const deepLink = `${baseUrl}?utm_source=affiliate_${platform}&aff_id=${affiliateId}`;
    
    return {
      affiliate_id: affiliateId,
      platform,
      deep_link: deepLink,
      qr_code_data: deepLink, // Frontend generates the actual visual QR code from this string
      commission_rule: "5% per successful delivery via this link"
    };
  }

  // 3. Create Marketing Campaign
  async createCampaign(body: any) {
    // Basic Margin Protection check could be added here if deal.service was injected,
    // but for simplicity, we assume margin checks passed on frontend or are static here.
    
    const campaign = await this.prisma.marketingCampaign.create({
      data: {
        title: body.title,
        description: body.description,
        discount_pct: Number(body.discount_pct),
        image_url: body.image_url || null,
        published_pos: body.published_pos === 'true' || body.published_pos === true,
        published_web: body.published_web === 'true' || body.published_web === true,
        published_social: body.published_social === 'true' || body.published_social === true,
      }
    });

    // Mock Social Media Posting
    if (campaign.published_social) {
      console.log(`[SOCIAL MEDIA] Successfully posted "${campaign.title}" to Facebook Graph API.`);
      console.log(`[SOCIAL MEDIA] Successfully posted "${campaign.title}" to Instagram Graph API.`);
    }

    return {
      success: true,
      message: 'Campaign created successfully',
      campaign,
    };
  }

  // 4. Get Active Campaigns
  async getCampaigns() {
    return this.prisma.marketingCampaign.findMany({
      where: { is_active: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateCampaign(id: number, data: any) {
    const { id: _, createdAt, updatedAt, ...updateData } = data;
    return this.prisma.marketingCampaign.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCampaign(id: number) {
    return this.prisma.marketingCampaign.delete({
      where: { id }
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
        target_category_id: body.target_category_id ? Number(body.target_category_id) : null,
        target_product_id: body.target_product_id ? Number(body.target_product_id) : null,
        start_date: new Date(body.start_date),
        end_date: new Date(body.end_date),
        target_stores: body.target_stores || 'ALL'
      }
    });
  }

  // 6. Get Scheduled Discounts
  async getScheduledDiscounts() {
    return this.prisma.scheduledDiscount.findMany({
      orderBy: { start_date: 'asc' }
    });
  }

  async updateScheduledDiscount(id: number, data: any) {
    const { id: _, createdAt, updatedAt, ...updateData } = data;
    
    // Parse dates if they exist in update
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
      where: { id }
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
        end_date: { gte: now }
      }
    });

    for (const sched of activeSchedules) {
      // Check if campaign already exists for this schedule
      const existing = await this.prisma.marketingCampaign.findFirst({
        where: { title: `[AUTO] ${sched.title}` }
      });
      
      if (!existing) {
        console.log(`[CRON] Auto-activating Scheduled Discount: ${sched.title}`);
        await this.createCampaign({
          title: `[AUTO] ${sched.title}`,
          description: `Automatically scheduled discount of ${sched.discount_pct}%`,
          discount_pct: sched.discount_pct,
          published_pos: true,
          published_web: true,
          published_social: true
        });
        
        // Push notification (simulate)
        console.log(`[CRON] Posted Scheduled Deal to Facebook/Instagram: ${sched.title}`);
      }
    }
    
    // Also, mark expired as inactive
    await this.prisma.scheduledDiscount.updateMany({
      where: {
        is_active: true,
        end_date: { lt: now }
      },
      data: { is_active: false }
    });
  }
}
