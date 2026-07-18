import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class DealService {
  constructor(private prisma: PrismaService) {}

  // Constant Safety Threshold defined in Master Blueprint
  private readonly SAFETY_THRESHOLD_PCT = 10.0;

  // 1. Calculate Deal Eligibility and Enforce Margin Protection
  async calculateDealDiscount(
    product_id: number,
    quantity: number,
    requested_discount_pct: number,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: product_id },
    });

    if (!product) throw new BadRequestException('Product not found');

    // Calculate actual profit margin
    const profitMarginPct =
      ((product.price - product.cost) / product.price) * 100;

    // Check Margin Protection Trigger
    const resultingMargin = profitMarginPct - requested_discount_pct;

    if (resultingMargin < this.SAFETY_THRESHOLD_PCT) {
      return {
        allowed: false,
        reason: 'MARGIN_PROTECTION_TRIGGERED',
        message: `Deal auto-suspended. Margin drops to ${resultingMargin.toFixed(2)}%, below safety threshold of ${this.SAFETY_THRESHOLD_PCT}%.`,
      };
    }

    return {
      allowed: true,
      original_price: product.price * quantity,
      discounted_price:
        product.price * quantity * (1 - requested_discount_pct / 100),
      final_margin_pct: resultingMargin,
    };
  }
}
