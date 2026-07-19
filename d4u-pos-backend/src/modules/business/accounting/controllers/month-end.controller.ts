import { Controller, Post, Body, Param, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { MonthEndClosingService } from '../services/month-end-closing.service';
import { MonthEndClosingInput } from '../interfaces/month-end.interface';

@Controller('accounting/month-end')
export class MonthEndController {
  constructor(private readonly monthEndService: MonthEndClosingService) {}

  @RequirePermissions('finance.accounting.create')
  @Post('execute')
  async executeMonthEnd(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.monthEndService.executeClosing(body, userId);
  }

  @RequirePermissions('finance.accounting.create')
  @Post('rollback/:periodId')
  async rollbackMonthEnd(@Param('periodId') periodId: string, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.monthEndService.rollbackClosing(Number(periodId), userId);
  }
}
