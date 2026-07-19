import { Controller, Get, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { FinancialKpiService } from '../services/financial-kpi.service';
import { FinancialRatioService } from '../services/financial-ratio.service';
import { KpiFilter } from '../interfaces/financial-kpi.interface';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting')
export class FinancialKpiController {
  constructor(
    private readonly kpiService: FinancialKpiService,
    private readonly ratioService: FinancialRatioService
  ) {}

  @Get('kpis')
  async getKpis(@Query() query: any, @Req() req: any) {
    const filter: KpiFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1; 
    return this.kpiService.generateKpis(filter, userId);
  }

  @Get('financial-ratios')
  async getRatios(@Query() query: any, @Req() req: any) {
    const filter: KpiFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1; 
    return this.ratioService.generateRatios(filter, userId);
  }
}
