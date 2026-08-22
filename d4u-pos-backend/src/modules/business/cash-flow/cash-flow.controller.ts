import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { CashFlowService } from './cash-flow.service';
import { CashInDto, CashOutDto } from './dto';

@Controller('cash-flow')
export class CashFlowController {
  constructor(private readonly service: CashFlowService) {}

  // GET /cash-flow?store_id=1 — آج کی cash movements
  // Task #2R-E4: migrated off the legacy 'finance.accounting.*' onto
  // 'pos.cash_drawer.record' (#2R-E2/#2R-E3) -- this is POS-operational
  // cash-drawer activity, not accounting/finance. Straight swap, not
  // additive -- #2R-D already removed finance.accounting.view/create from
  // PermissionsGuard's compatibility bridge, so nothing legitimate was
  // reachable through the old string to preserve.
  @RequirePermissions('pos.cash_drawer.record')
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
  @RequirePermissions('pos.cash_drawer.record')
  @Get('summary')
  getSummary(@Query('store_id') store_id: string) {
    return this.service.getCashSummary(Number(store_id));
  }

  // POST /cash-flow/in — Cash In
  @RequirePermissions('pos.cash_drawer.record')
  @Post('in')
  cashIn(@Body() body: CashInDto) {
    console.log(`[POST] Cash In — Rs.${body.amount} — Store: ${body.store_id}`);
    return this.service.cashIn(body);
  }

  // POST /cash-flow/out — Cash Out
  @RequirePermissions('pos.cash_drawer.record')
  @Post('out')
  cashOut(@Body() body: CashOutDto) {
    console.log(
      `[POST] Cash Out — Rs.${body.amount} — Store: ${body.store_id}`,
    );
    return this.service.cashOut(body);
  }
}
