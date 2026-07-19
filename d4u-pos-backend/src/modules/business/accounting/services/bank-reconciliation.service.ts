import { Injectable, BadRequestException } from '@nestjs/common';
import { BankReconciliationRepository } from '../repositories/bank-reconciliation.repository';
import { ReconciliationMatchingService } from './reconciliation-matching.service';
import { JournalEntryService } from './journal-entry.service';
import { RunReconciliationInput, CreateAdjustmentInput } from '../interfaces/bank-reconciliation.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BankReconciliationCompletedEvent } from '../events/bank-reconciliation-completed.event';
import { BankReconciliationAdjustmentCreatedEvent } from '../events/bank-reconciliation-adjustment-created.event';

@Injectable()
export class BankReconciliationService {
  constructor(
    private readonly repository: BankReconciliationRepository,
    private readonly matchingService: ReconciliationMatchingService,
    private readonly journalService: JournalEntryService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async runReconciliation(input: RunReconciliationInput, userId: number) {
    const statement = await this.repository.getStatement(input.statement_id);
    if (!statement) throw new BadRequestException('Statement not found');

    let recon = await this.repository.createReconciliation({
      store_id: input.store_id,
      statement_id: input.statement_id,
      reconciliation_date: new Date(),
      status: 'IN_PROGRESS',
      executed_by: userId
    });

    // Run Auto-matching
    await this.matchingService.autoMatch(input.store_id, input.statement_id, statement.account_id, userId);

    return recon;
  }

  async createAdjustment(input: CreateAdjustmentInput, userId: number) {
    const journalDto: any = {
      fiscal_year_id: 1, 
      accounting_period_id: 1,
      currency_id: 1,
      posting_date: new Date(),
      reference_number: `ADJ-REC-${input.reconciliation_id}`,
      description: input.reason,
      lines: [
        {
          account_id: input.adjustment_account_id,
          debit_amount: input.amount > 0 ? input.amount : 0,
          credit_amount: input.amount < 0 ? Math.abs(input.amount) : 0,
          description: 'Reconciliation Adjustment'
        },
        {
          account_id: input.statement_account_id,
          debit_amount: input.amount < 0 ? Math.abs(input.amount) : 0,
          credit_amount: input.amount > 0 ? input.amount : 0,
          description: 'Reconciliation Adjustment Offset'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    const adj = await this.repository.createAdjustment({
      reconciliation_id: input.reconciliation_id,
      journal_entry_id: je.id,
      amount: input.amount,
      reason: input.reason
    });

    this.eventBus.publish(new BankReconciliationAdjustmentCreatedEvent(
      input.store_id, 0, userId, adj.id.toString(), 'adjustment_created', { amount: input.amount }
    ));

    return adj;
  }

  async finalizeReconciliation(id: number, userId: number) {
    const recon = await this.repository.getReconciliation(id);
    if (!recon) throw new BadRequestException('Reconciliation not found');

    let matchedAmount = 0;
    let unmatchedAmount = 0;

    for (const line of recon.statement.lines) {
      if (line.is_reconciled) matchedAmount += Number(line.amount);
      else unmatchedAmount += Number(line.amount);
    }

    await this.repository.updateReconciliationStatus(id, 'COMPLETED', matchedAmount, unmatchedAmount);

    this.eventBus.publish(new BankReconciliationCompletedEvent(
      recon.store_id, 0, userId, recon.id.toString(), 'reconciliation_completed', { matched: matchedAmount, unmatched: unmatchedAmount }
    ));

    return { success: true };
  }

  async getReconciliation(id: number) {
    return this.repository.getReconciliation(id);
  }
}
