import { Injectable } from '@nestjs/common';
import { ProfitLossRepository } from '../repositories/profit-loss.repository';
import { ProfitLossValidator } from '../validators/profit-loss.validator';
import { FinancialStatementBuilderService } from './financial-statement-builder.service';
import { ProfitLossFilter } from '../interfaces/profit-loss-filter.interface';
import { ProfitLossResult } from '../interfaces/profit-loss-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { ProfitLossGeneratedEvent } from '../events/profit-loss-generated.event';
import { StatementSectionResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class ProfitLossService {
  constructor(
    private readonly repository: ProfitLossRepository,
    private readonly validator: ProfitLossValidator,
    private readonly builderService: FinancialStatementBuilderService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateProfitLoss(filter: ProfitLossFilter, userId: number): Promise<ProfitLossResult> {
    const { statement } = await this.validator.validateFilters(filter);

    // Build the underlying statement
    const fsResult = await this.builderService.buildStatement(
      filter.store_id,
      statement.id,
      filter.start_date,
      filter.end_date,
      filter.fiscal_year_id,
      userId
    );

    const user = await this.repository.getUser(userId);
    const generatedBy = user ? user.name : 'System';

    const result: ProfitLossResult = {
      store_id: filter.store_id,
      statement_id: statement.id,
      statement_name: statement.name,
      start_date: filter.start_date,
      end_date: filter.end_date,
      revenue_sections: [],
      total_revenue: 0,
      cost_of_sales_sections: [],
      total_cost_of_sales: 0,
      gross_profit: 0,
      operating_expense_sections: [],
      total_operating_expenses: 0,
      operating_income: 0,
      other_income_sections: [],
      total_other_income: 0,
      other_expense_sections: [],
      total_other_expenses: 0,
      net_profit_before_tax: 0,
      tax_expense: 0, // Future ready
      net_profit: 0,
      generated_date: new Date(),
      generated_by: generatedBy
    };

    // Helper to get total of sections and push them
    const processSections = (type: string, targetSections: StatementSectionResult[]) => {
      const sections = fsResult.sections.filter(s => s.type === type);
      let total = 0;
      for (const s of sections) {
        targetSections.push(s);
        // Reverse signs for expenses based on standard if needed, or keep raw. We'll use absolute logic based on normal balances.
        // Assuming trial balance gives raw amounts, revenue credit is positive net balance, expense debit is positive net balance.
        // The TrialBalance engine returns absolute closing_balance. We sum them up.
        total += s.total_amount;
      }
      return total;
    };

    result.total_revenue = processSections('REVENUE', result.revenue_sections);
    result.total_cost_of_sales = processSections('COST_OF_SALES', result.cost_of_sales_sections);
    
    // Revenue is normally Credit, COGS is Debit. Net revenue - COGS.
    result.gross_profit = result.total_revenue - result.total_cost_of_sales;

    result.total_operating_expenses = processSections('OPERATING_EXPENSES', result.operating_expense_sections);
    result.operating_income = result.gross_profit - result.total_operating_expenses;

    result.total_other_income = processSections('OTHER_INCOME', result.other_income_sections);
    result.total_other_expenses = processSections('OTHER_EXPENSE', result.other_expense_sections);

    result.net_profit_before_tax = result.operating_income + result.total_other_income - result.total_other_expenses;
    result.net_profit = result.net_profit_before_tax - result.tax_expense;

    this.eventBus.publish(new ProfitLossGeneratedEvent(filter.store_id, 0, userId, statement.id.toString(), 'generate', { filter }));

    return result;
  }
}
