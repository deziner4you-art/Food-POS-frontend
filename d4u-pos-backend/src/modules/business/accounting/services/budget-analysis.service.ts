import { Injectable, BadRequestException } from '@nestjs/common';
import { BudgetRepository } from '../repositories/budget.repository';
import { TrialBalanceService } from './trial-balance.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BudgetAnalysisFilter, BudgetAnalysisResult, BudgetAnalysisLine } from '../interfaces/budget-analysis.interface';
import { BudgetComparisonGeneratedEvent } from '../events/budget-comparison-generated.event';

@Injectable()
export class BudgetAnalysisService {
  constructor(
    private readonly budgetRepo: BudgetRepository,
    private readonly tbService: TrialBalanceService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async generateComparison(filter: BudgetAnalysisFilter, userId: number): Promise<BudgetAnalysisResult> {
    const budget = await this.budgetRepo.getActiveBudget(filter.budget_id);
    if (!budget) throw new BadRequestException('Budget not found');
    
    const activeVersion = budget.versions[0];
    if (!activeVersion) throw new BadRequestException('No active budget version found');

    const tbResult = await this.tbService.generateTrialBalance({
      store_id: filter.store_id,
      fiscal_year_id: filter.fiscal_year_id,
      start_date: filter.start_date,
      end_date: filter.end_date
    }, userId);

    const actualsMap = new Map<number, number>(); // account_id -> net_balance
    for (const tbLine of tbResult.lines) {
      actualsMap.set(tbLine.account_id, tbLine.net_balance);
    }

    let totalBudget = 0;
    let totalActual = 0;
    const lines: BudgetAnalysisLine[] = [];

    for (const bLine of activeVersion.lines) {
      const budgetAmount = Number(bLine.amount);
      const actualAmount = bLine.account_id ? (actualsMap.get(bLine.account_id) || 0) : 0; // Simple mapping logic

      // Revenue vs Expense logic for Favorable/Unfavorable
      // In this basic version, positive variance is under-budget (Favorable for expenses)
      const variance = budgetAmount - actualAmount;
      const variancePct = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
      
      let status: 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TRACK' = 'ON_TRACK';
      if (variance > 0) status = 'FAVORABLE'; // Spent less than budget
      if (variance < 0) status = 'UNFAVORABLE'; // Spent more than budget
      
      lines.push({
        account_code: bLine.account?.code || bLine.account_group?.code || 'UNKNOWN',
        account_name: bLine.account?.name || bLine.account_group?.name || 'UNKNOWN',
        budget_amount: budgetAmount,
        actual_amount: actualAmount,
        variance,
        variance_pct: Number(variancePct.toFixed(2)),
        status
      });

      totalBudget += budgetAmount;
      totalActual += actualAmount;
    }

    const totalVariance = totalBudget - totalActual;
    const totalVariancePct = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

    const result: BudgetAnalysisResult = {
      budget_id: budget.id,
      store_id: filter.store_id,
      fiscal_year_id: filter.fiscal_year_id,
      total_budget: totalBudget,
      total_actual: totalActual,
      total_variance: totalVariance,
      total_variance_pct: Number(totalVariancePct.toFixed(2)),
      lines
    };

    this.eventBus.publish(new BudgetComparisonGeneratedEvent(
      filter.store_id, 0, userId, filter.budget_id.toString(), 'budget_analysis', { variance: totalVariancePct }
    ));

    return result;
  }
}
