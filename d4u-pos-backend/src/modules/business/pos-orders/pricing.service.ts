import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async calculatePricing(params: {
    store_id: number;
    items: any[];
    couponCode?: string;
  }) {
    const { store_id, items, couponCode } = params;

    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    let totalDiscount = 0;
    const appliedRules = [];

    // 1. Automatic Campaigns (RUNNING status)
    const activeCampaigns = await this.prisma.marketingCampaign.findMany({
      where: {
        status: 'RUNNING',
        OR: [
          { target_stores: { none: {} } },
          { target_stores: { some: { id: store_id } } },
        ]
      },
      include: {
        target_categories: true,
        target_products: true,
      }
    });

    for (const campaign of activeCampaigns) {
      let applicableSubtotal = 0;
      for (const item of items) {
        const productMatches = campaign.target_products.some(p => p.id === item.product_id || p.id === item.id);
        const categoryMatches = campaign.target_categories.some(c => c.id === item.category_id);
        
        if (campaign.target_products.length === 0 && campaign.target_categories.length === 0) {
          applicableSubtotal += (item.price * item.quantity); // Global discount
        } else if (productMatches || categoryMatches) {
          applicableSubtotal += (item.price * item.quantity);
        }
      }

      const discount = applicableSubtotal * (campaign.discount_pct / 100);
      if (discount > 0) {
        totalDiscount += discount;
        appliedRules.push(`Campaign: ${campaign.title}`);
      }
    }

    // 2. Manual Coupons (e.g. CAMP-xx)
    if (couponCode) {
      // Logic for explicit coupons if any. 
      // For now we assume automatic campaigns cover most of it, but if couponCode maps to a specific campaign:
      if (couponCode.startsWith('CAMP-')) {
        const campId = parseInt(couponCode.replace('CAMP-', ''), 10);
        if (!isNaN(campId)) {
          const manualCamp = await this.prisma.marketingCampaign.findUnique({
            where: { id: campId },
            include: { target_categories: true, target_products: true }
          });
          if (manualCamp && manualCamp.status === 'RUNNING') {
            // Already handled by automatic, unless it was exclusive.
          }
        }
      }
    }

    // Future placeholders for Loyalty, Happy Hour, Taxes, Delivery
    let tax = 0; // Tax calculation
    let deliveryFee = 0;

    let finalTotal = subtotal - totalDiscount + tax + deliveryFee;
    if (finalTotal < 0) finalTotal = 0;

    return {
      subtotal,
      discount: totalDiscount,
      tax,
      deliveryFee,
      total: finalTotal,
      appliedRules
    };
  }
}
