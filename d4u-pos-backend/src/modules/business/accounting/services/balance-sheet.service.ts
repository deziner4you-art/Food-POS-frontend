import { Injectable } from '@nestjs/common';
import { BalanceSheetRepository } from '../repositories/balance-sheet.repository';
import { BalanceSheetValidator } from '../validators/balance-sheet.validator';
import { FinancialStatementBuilderService } from './financial-statement-builder.service';
import { ProfitLossService } from './profit-loss.service';
import { BalanceSheetFilter } from '../interfaces/balance-sheet-filter.interface';
import { BalanceSheetResult } from '../interfaces/balance-sheet-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BalanceSheetGeneratedEvent } from '../events/balance-sheet-generated.event';
import { StatementSectionResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class BalanceSheetService {
  constructor(
    private readonly repository: BalanceSheetRepository,
    private readonly validator: BalanceSheetValidator,
    private readonly builderService: FinancialStatementBuilderService,
    private readonly plService: ProfitLossService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateBalanceSheet(filter: BalanceSheetFilter, userId: number): Promise<BalanceSheetResult> {
    const { statement, fiscalYear } = await this.validator.validateFilters(filter);

    // Trial balance needs start date of fiscal year to get accurate opening + period = closing for BS
    const fsResult = await this.builderService.buildStatement(
      filter.store_id,
      statement.id,
      fiscalYear.start_date,
      filter.date,
      filter.fiscal_year_id,
      userId
    );

    // Get current year profit from P&L
    const plResult = await this.plService.generateProfitLoss({
      store_id: filter.store_id,
      fiscal_year_id: filter.fiscal_year_id,
      accounting_period_id: filter.accounting_period_id,
      start_date: fiscalYear.start_date,
      end_date: filter.date
    }, userId);

    const user = await this.repository.getUser(userId);
    const generatedBy = user ? user.name : 'System';

    const result: BalanceSheetResult = {
      store_id: filter.store_id,
      statement_id: statement.id,
      statement_name: statement.name,
      date: filter.date,
      asset_sections: [],
      total_assets: 0,
      liability_sections: [],
      total_liabilities: 0,
      equity_sections: [],
      total_equity_mapped: 0,
      current_year_profit: plResult.net_profit,
      total_equity: 0,
      total_liabilities_and_equity: 0,
      difference: 0,
      generated_date: new Date(),
      generated_by: generatedBy
    };

    const processSections = (type: string, targetSections: StatementSectionResult[]) => {
      const sections = fsResult.sections.filter(s => s.type === type);
      let total = 0;
      for (const s of sections) {
        targetSections.push(s);
        total += s.total_amount;
      }
      return total;
    };

    result.total_assets = processSections('ASSETS', result.asset_sections);
    result.total_liabilities = processSections('LIABILITIES', result.liability_sections);
    result.total_equity_mapped = processSections('EQUITY', result.equity_sections);

    result.total_equity = result.total_equity_mapped + result.current_year_profit;
    result.total_liabilities_and_equity = result.total_liabilities + result.total_equity;
    
    // Assets = Liabilities + Equity. Difference should be 0.
    result.difference = result.total_assets - result.total_liabilities_and_equity;

    this.eventBus.publish(new BalanceSheetGeneratedEvent(filter.store_id, 0, userId, statement.id.toString(), 'generate', { filter }));

    return result;
  }
}
