import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CashFlowService } from './cash-flow.service';

@Controller('cash-flow')
export class CashFlowController {
  constructor(private readonly service: CashFlowService) {}

  // GET /cash-flow?store_id=1 — آج کی cash movements
  @Get()
  getCashFlow(
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id?: string,
  ) {
    return this.service.getCashFlowByDay(
      Number(store_id),
      business_day_id ? Number(business_day_id) : undefined,
    );
  }

  // GET /cash-flow/summary?store_id=1
  @Get('summary')
  getSummary(@Query('store_id') store_id: string) {
    return this.service.getCashSummary(Number(store_id));
  }

  // POST /cash-flow/in — Cash In
  @Post('in')
  cashIn(
    @Body()
    body: {
      store_id: number;
      user_id: number;
      amount: number;
      comment?: string;
    },
  ) {
    console.log(`[POST] Cash In — Rs.${body.amount} — Store: ${body.store_id}`);
    return this.service.cashIn(body);
  }

  // POST /cash-flow/out — Cash Out
  @Post('out')
  cashOut(
    @Body()
    body: {
      store_id: number;
      user_id: number;
      amount: number;
      comment?: string;
    },
  ) {
    console.log(
      `[POST] Cash Out — Rs.${body.amount} — Store: ${body.store_id}`,
    );
    return this.service.cashOut(body);
  }
}
