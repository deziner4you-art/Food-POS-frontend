import { Controller, Post, Body } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { DealService } from './deal.service';
import { CalculateDealDto } from './dto';

@Controller('deal')
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @RequirePermissions('crm.create')
  @Post('calculate')
  async calculateDeal(@Body() body: CalculateDealDto) {
    return this.dealService.calculateDealDiscount(
      body.product_id,
      body.quantity,
      body.requested_discount_pct,
    );
  }
}
