import { Controller, Get, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { TrialBalanceService } from '../services/trial-balance.service';
import { TrialBalanceFilter } from '../interfaces/trial-balance-filter.interface';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/trial-balance')
export class TrialBalanceController {
  constructor(private readonly trialBalanceService: TrialBalanceService) {}

  @Get()
  async getTrialBalance(@Query() query: any, @Req() req: any) {
    const filter: TrialBalanceFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1; // Fallback for simulation
    return this.trialBalanceService.generateTrialBalance(filter, userId);
  }

  @Get('export')
  async exportTrialBalance(@Query() query: any, @Req() req: any) {
    const filter: TrialBalanceFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1;
    const result = await this.trialBalanceService.generateTrialBalance(filter, userId);
    
    // Very basic CSV generation for demonstration
    let csv = 'Account Code,Account Name,Opening Debit,Opening Credit,Period Debit,Period Credit,Closing Debit,Closing Credit,Net Balance\n';
    for (const line of result.lines) {
      csv += `${line.account_code},${line.account_name},${line.opening_debit},${line.opening_credit},${line.period_debit},${line.period_credit},${line.closing_debit},${line.closing_credit},${line.net_balance}\n`;
    }

    return { type: 'csv', data: csv };
  }
}
