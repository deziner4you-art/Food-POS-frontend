import { Injectable } from '@nestjs/common';
import { BankReconciliationRepository } from '../repositories/bank-reconciliation.repository';
import { MatchTransactionInput } from '../interfaces/bank-reconciliation.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BankTransactionMatchedEvent } from '../events/bank-transaction-matched.event';

@Injectable()
export class ReconciliationMatchingService {
  constructor(
    private readonly repository: BankReconciliationRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async autoMatch(storeId: number, statementId: number, accountId: number, userId: number) {
    const unmatchedLines = await this.repository.getUnmatchedLines(statementId);
    if (unmatchedLines.length === 0) return { matched_count: 0 };

    // Get journal lines for the last month (example heuristic)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    
    const journalLines = await this.repository.getJournalLinesForMatching(storeId, accountId, startDate, endDate);
    
    let matchedCount = 0;

    for (const line of unmatchedLines) {
      // Very basic auto-matching heuristic: Match exact amount
      // In real life: Match amount + near date + ref number
      const match = journalLines.find(jl => 
        (Number(jl.debit_amount) - Number(jl.credit_amount)) === Number(line.amount)
      );

      if (match) {
        await this.repository.matchStatementLine(line.id, match.id);
        matchedCount++;
        
        this.eventBus.publish(new BankTransactionMatchedEvent(
          storeId, 0, userId, line.id.toString(), 'auto_matched', { journal_line_id: match.id }
        ));
      }
    }

    return { matched_count: matchedCount };
  }

  async manualMatch(input: MatchTransactionInput, userId: number) {
    await this.repository.matchStatementLine(input.statement_line_id, input.journal_line_id);
    
    this.eventBus.publish(new BankTransactionMatchedEvent(
      input.store_id, 0, userId, input.statement_line_id.toString(), 'manual_matched', { journal_line_id: input.journal_line_id }
    ));

    return { success: true };
  }
}
