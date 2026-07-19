import { Controller, Get, Post, Put, Body, Param, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { BudgetService } from '../services/budget.service';
import { BudgetAnalysisService } from '../services/budget-analysis.service';
import { CreateBudgetInput } from '../interfaces/budget.interface';
import { BudgetAnalysisFilter } from '../interfaces/budget-analysis.interface';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/budget')
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly analysisService: BudgetAnalysisService
  ) {}

  @Post()
  async createBudget(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.budgetService.createBudget(body, userId);
  }

  @Put(':id/approve')
  async approveBudget(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.budgetService.approveBudget(Number(id), userId);
  }

  @Get('vs-actual')
  async getBudgetVsActual(@Query() query: any, @Req() req: any) {
    const filter: BudgetAnalysisFilter = {
      store_id: Number(query.store_id),
      fiscal_year_id: Number(query.fiscal_year_id),
      budget_id: Number(query.budget_id),
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date)
    };
    const userId = req.user?.id || 1;
    return this.analysisService.generateComparison(filter, userId);
  }
}
