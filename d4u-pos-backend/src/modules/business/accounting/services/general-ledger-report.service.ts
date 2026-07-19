import { Injectable, Logger } from '@nestjs/common';
import { GeneralLedgerReportRepository } from '../repositories/general-ledger-report.repository';
import { GeneralLedgerValidator } from '../validators/general-ledger.validator';
import { GeneralLedgerFilter } from '../interfaces/general-ledger-filter.interface';
import { GeneralLedgerResult } from '../interfaces/general-ledger-result.interface';
import { GeneralLedgerLineResult } from '../interfaces/general-ledger-line.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { GeneralLedgerReportGeneratedEvent } from '../events/general-ledger-report-generated.event';

@Injectable()
export class GeneralLedgerReportService {
  private readonly logger = new Logger(GeneralLedgerReportService.name);

  constructor(
    private readonly repository: GeneralLedgerReportRepository,
    private readonly validator: GeneralLedgerValidator,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateReport(filter: GeneralLedgerFilter, userId: number): Promise<GeneralLedgerResult> {
    await this.validator.validateFilters(filter);

    const prismaFilter: any = {
      store_id: filter.store_id,
      posting_date: { gte: filter.start_date, lte: filter.end_date }
    };

    if (filter.account_id) prismaFilter.account_id = filter.account_id;
    if (filter.journal_number) prismaFilter.journal_entry = { journal_number: filter.journal_number };

    // Fetch opening balance if single account is filtered
    let openingBalance = 0;
    if (filter.account_id) {
      const ob = await this.repository.getOpeningBalance(filter.store_id, filter.account_id, filter.start_date);
      // Determine net balance based on root_type logic later, simplified here to Dr - Cr for ASSET/EXPENSE, otherwise Cr - Dr
      // Note: GeneralLedger report often presents running balance raw or based on account normal balance.
      const opDr = ob?.debit ? Number(ob.debit) : 0;
      const opCr = ob?.credit ? Number(ob.credit) : 0;
      // We will keep a raw signed running balance for simplicity, or we compute based on account type
      openingBalance = opDr - opCr; // Simple debit positive, credit negative approach
    }

    const glEntries = await this.repository.getLedgerLines(prismaFilter);

    const lines: GeneralLedgerLineResult[] = [];
    let runningBalance = openingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    for (const rawEntry of glEntries) {
      const entry: any = rawEntry;
      const debit = Number(entry.debit);
      const credit = Number(entry.credit);
      totalDebit += debit;
      totalCredit += credit;
      runningBalance += (debit - credit);

      const je = entry.journal_entry;
      const voucher = je?.voucher; 
      const eventModule = je?.reference_type || 'MANUAL';

      lines.push({
        posting_date: entry.posting_date,
        account_code: entry.account?.code || '',
        account_name: entry.account?.name || '',
        journal_number: je?.journal_number || '',
        voucher_number: voucher?.voucher_number || '',
        reference_module: eventModule,
        reference_number: je?.reference_number || '',
        description: entry.journal_entry_line?.description || '',
        debit,
        credit,
        running_balance: runningBalance,
        posted_by: je?.created_by ? `User ${je.created_by}` : 'System',
        created_at: entry.created_at
      });
    }

    const result: GeneralLedgerResult = {
      store_id: filter.store_id,
      start_date: filter.start_date,
      end_date: filter.end_date,
      account_id: filter.account_id,
      opening_balance: openingBalance,
      lines,
      closing_balance: runningBalance,
      total_debit: totalDebit,
      total_credit: totalCredit,
    };

    this.eventBus.publish(new GeneralLedgerReportGeneratedEvent(filter.store_id, 0, userId, 'GL_REPORT', 'generateReport', { filter }));

    return result;
  }
}
