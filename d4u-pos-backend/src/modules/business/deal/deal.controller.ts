import { Controller, Post, Body } from '@nestjs/common';
import { DealService } from './deal.service';

@Controller('deal')
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post('calculate')
  async calculateDeal(
    @Body()
    body: {
      product_id: number;
      quantity: number;
      requested_discount_pct: number;
    },
  ) {
    return this.dealService.calculateDealDiscount(
      body.product_id,
      body.quantity,
      body.requested_discount_pct,
    );
  }
}
