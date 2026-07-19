import { Injectable, Logger } from '@nestjs/common';
import { TrialBalanceRepository } from '../repositories/trial-balance.repository';
import { TrialBalanceValidator } from '../validators/trial-balance.validator';
import { TrialBalanceFilter } from '../interfaces/trial-balance-filter.interface';
import { TrialBalanceResult, TrialBalanceLine } from '../interfaces/trial-balance-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { TrialBalanceGeneratedEvent } from '../events/trial-balance-generated.event';

@Injectable()
export class TrialBalanceService {
  private readonly logger = new Logger(TrialBalanceService.name);

  constructor(
    private readonly repository: TrialBalanceRepository,
    private readonly validator: TrialBalanceValidator,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateTrialBalance(filter: TrialBalanceFilter, userId: number): Promise<TrialBalanceResult> {
    await this.validator.validateFilters(filter);

    const data = await this.repository.getAccountBalances(filter.store_id, filter.start_date, filter.end_date);
    
    const lines: TrialBalanceLine[] = [];
    let totOpDr = 0, totOpCr = 0, totPerDr = 0, totPerCr = 0, totClDr = 0, totClCr = 0;

    for (const account of data.accounts) {
      const op = data.openingEntries.find(o => o.account_id === account.id);
      const per = data.periodEntries.find(p => p.account_id === account.id);

      const opDr = op?._sum?.debit ? Number(op._sum.debit) : 0;
      const opCr = op?._sum?.credit ? Number(op._sum.credit) : 0;
      
      const perDr = per?._sum?.debit ? Number(per._sum.debit) : 0;
      const perCr = per?._sum?.credit ? Number(per._sum.credit) : 0;

      const clDr = opDr + perDr;
      const clCr = opCr + perCr;

      let netBalance = 0;
      // Depending on normal balance
      const rootType = account.account_group?.root_type || '';
      if (['ASSET', 'EXPENSE'].includes(rootType)) {
        netBalance = clDr - clCr;
      } else {
        netBalance = clCr - clDr;
      }

      // Only include accounts with activity or balances
      if (clDr > 0 || clCr > 0) {
        lines.push({
          account_id: account.id,
          account_code: account.code,
          account_name: account.name,
          account_type: rootType,
          opening_debit: opDr,
          opening_credit: opCr,
          period_debit: perDr,
          period_credit: perCr,
          closing_debit: clDr,
          closing_credit: clCr,
          net_balance: netBalance,
        });

        totOpDr += opDr;
        totOpCr += opCr;
        totPerDr += perDr;
        totPerCr += perCr;
        totClDr += clDr;
        totClCr += clCr;
      }
    }

    const result: TrialBalanceResult = {
      store_id: filter.store_id,
      start_date: filter.start_date,
      end_date: filter.end_date,
      lines,
      total_opening_debit: totOpDr,
      total_opening_credit: totOpCr,
      total_period_debit: totPerDr,
      total_period_credit: totPerCr,
      total_closing_debit: totClDr,
      total_closing_credit: totClCr,
    };

    this.eventBus.publish(new TrialBalanceGeneratedEvent(filter.store_id, 0, userId, 'TRIAL_BALANCE', 'generateTrialBalance', { start_date: filter.start_date, end_date: filter.end_date }));

    return result;
  }
}
