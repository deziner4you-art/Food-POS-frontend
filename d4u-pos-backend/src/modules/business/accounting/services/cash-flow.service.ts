import { Injectable } from '@nestjs/common';
import { CashFlowRepository } from '../repositories/cash-flow.repository';
import { CashFlowValidator } from '../validators/cash-flow.validator';
import { CashFlowBuilderService } from './cash-flow-builder.service';
import { TrialBalanceService } from './trial-balance.service';
import { CashFlowFilter } from '../interfaces/cash-flow-filter.interface';
import { CashFlowResult } from '../interfaces/cash-flow-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CashFlowGeneratedEvent } from '../events/cash-flow-generated.event';
import { StatementSectionResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class CashFlowService {
  constructor(
    private readonly repository: CashFlowRepository,
    private readonly validator: CashFlowValidator,
    private readonly builderService: CashFlowBuilderService,
    private readonly tbService: TrialBalanceService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateCashFlow(filter: CashFlowFilter, userId: number): Promise<CashFlowResult> {
    const { statement, cashAccounts } = await this.validator.validateFilters(filter);

    const fsResult = await this.builderService.buildStatement(
      filter.store_id,
      statement.id,
      filter.start_date,
      filter.end_date,
      filter.fiscal_year_id,
      userId
    );

    // Get trial balance to calculate opening and closing cash
    const tb = await this.tbService.generateTrialBalance({
      fiscal_year_id: filter.fiscal_year_id,
      start_date: filter.start_date,
      end_date: filter.end_date,
      store_id: filter.store_id
    }, userId);

    const cashAccountIds = cashAccounts.map(c => c.id);
    
    let openingCash = 0;
    let closingCash = 0;

    for (const line of tb.lines) {
      if (cashAccountIds.includes(line.account_id)) {
        const tbLine: any = line;
        // Cash is an asset, so debit is positive.
        openingCash += (Number(tbLine.opening_debit || 0) - Number(tbLine.opening_credit || 0));
        closingCash += (Number(tbLine.closing_debit || 0) - Number(tbLine.closing_credit || 0));
      }
    }

    const user = await this.repository.getUser(userId);
    const generatedBy = user ? user.name : 'System';

    const result: CashFlowResult = {
      store_id: filter.store_id,
      statement_id: statement.id,
      statement_name: statement.name,
      start_date: filter.start_date,
      end_date: filter.end_date,
      operating_activities: [],
      net_operating_cash: 0,
      investing_activities: [],
      net_investing_cash: 0,
      financing_activities: [],
      net_financing_cash: 0,
      opening_cash: openingCash,
      closing_cash: closingCash,
      net_cash_movement: 0,
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

    result.net_operating_cash = processSections('OPERATING_ACTIVITIES', result.operating_activities);
    result.net_investing_cash = processSections('INVESTING_ACTIVITIES', result.investing_activities);
    result.net_financing_cash = processSections('FINANCING_ACTIVITIES', result.financing_activities);

    result.net_cash_movement = result.net_operating_cash + result.net_investing_cash + result.net_financing_cash;
    
    result.difference = (result.opening_cash + result.net_cash_movement) - result.closing_cash;

    this.eventBus.publish(new CashFlowGeneratedEvent(filter.store_id, 0, userId, statement.id.toString(), 'generate', { filter }));

    return result;
  }
}
