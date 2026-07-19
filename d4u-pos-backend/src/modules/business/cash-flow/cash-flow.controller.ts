import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { CashFlowService } from './cash-flow.service';
import { CashInDto, CashOutDto } from './dto';

@Controller('cash-flow')
export class CashFlowController {
  constructor(private readonly service: CashFlowService) {}

  // GET /cash-flow?store_id=1 — آج کی cash movements
  @RequirePermissions('finance.accounting.view')
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
  @RequirePermissions('finance.accounting.view')
  @Get('summary')
  getSummary(@Query('store_id') store_id: string) {
    return this.service.getCashSummary(Number(store_id));
  }

  // POST /cash-flow/in — Cash In
  @RequirePermissions('finance.accounting.create')
  @Post('in')
  cashIn(@Body() body: CashInDto) {
    console.log(`[POST] Cash In — Rs.${body.amount} — Store: ${body.store_id}`);
    return this.service.cashIn(body);
  }

  // POST /cash-flow/out — Cash Out
  @RequirePermissions('finance.accounting.create')
  @Post('out')
  cashOut(@Body() body: CashOutDto) {
    console.log(
      `[POST] Cash Out — Rs.${body.amount} — Store: ${body.store_id}`,
    );
    return this.service.cashOut(body);
  }
}
