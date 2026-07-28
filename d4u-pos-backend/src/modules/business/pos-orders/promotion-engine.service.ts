import { Injectable } from '@nestjs/common';
import { PricingService, CartLikeItem } from './pricing.service';

/**
 * The single, named Promotion Execution Engine every ordering channel must
 * go through (POS, Website, Customer App, Waiter Terminal, QR Menu, Kiosk,
 * future APIs). This is intentionally a thin wrapper — all matching/priority/
 * BOGO/bundle/gift/happy-hour logic lives in PricingService so there is
 * exactly one implementation, not two.
 */
@Injectable()
export class PromotionEngine {
  constructor(private pricing: PricingService) {}

  async calculate(params: { store_id: number; items: CartLikeItem[]; couponCode?: string }) {
    return this.pricing.calculatePricing(params);
  }
}
