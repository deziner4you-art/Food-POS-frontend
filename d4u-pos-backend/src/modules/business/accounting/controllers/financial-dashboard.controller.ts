import { Controller, Get, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { FinancialDashboardService } from '../services/financial-dashboard.service';
import { DashboardFilter } from '../interfaces/financial-dashboard.interface';
import { getSessionUserId } from '../../../../common/utils/session-context.util';

@Controller('accounting/dashboard')
export class FinancialDashboardController {
  constructor(private readonly dashboardService: FinancialDashboardService) {}

  @RequirePermissions('finance.reports.view')
  @Get()
  async getDashboard(@Query() query: any, @Req() req: any) {
    const filter: DashboardFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = getSessionUserId(req.user);
    return this.dashboardService.generateDashboard(filter, userId);
  }
}
