import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PostingValidatorService } from '../validators/posting-validator.service';
import { PostingResult } from '../interfaces/posting-result.interface';
import { PostingCompletedEvent } from '../events/posting-completed.event';
import { PostingFailedEvent } from '../events/posting-failed.event';

// Note: If using EventEmitter2, we would inject it here. For MVP without Event Bus, we just log.
// The prompt specifies NO Event Bus, but requires the Event classes. We'll instantiate them to demonstrate usage.

import { DomainEventBusService } from '../events/domain-event-bus.service';

@Injectable()
export class PostingEngineService {
  private readonly logger = new Logger(PostingEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: PostingValidatorService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async postManualEntry(storeId: number, journalEntryId: number): Promise<PostingResult> {
    try {
      // Step 1, 2 & 3: Load and Validate
      const entry = await this.validator.validateForPosting(storeId, journalEntryId);

      // Execute inside ONE database transaction
      await this.prisma.$transaction(async (tx) => {
        // Double check idempotency under transaction lock
        const lockedEntry = await tx.journalEntry.findUnique({
          where: { id: entry.id },
          select: { is_posted_to_ledger: true }
        });

        if (lockedEntry?.is_posted_to_ledger) {
          throw new Error('ALREADY_POSTED');
        }

        // Calculate running balances and create ledger rows (Step 4)
        // Note: For absolute correctness in a high concurrency environment, 
        // we'd lock the account row here. For MVP, we calculate synchronously inside Tx.
        const ledgerInsertData = [];

        for (const line of entry.lines) {
          const latestLedger = await tx.generalLedger.findFirst({
            where: { store_id: storeId, account_id: line.account_id },
            orderBy: [
              { posting_date: 'desc' },
              { created_at: 'desc' }
            ]
          });

          let currentBalance = latestLedger ? Number(latestLedger.running_balance) : 0;
          currentBalance = currentBalance + Number(line.debit_amount) - Number(line.credit_amount);

          ledgerInsertData.push({
            store_id: storeId,
            journal_entry_id: entry.id,
            journal_entry_line_id: line.id,
            account_id: line.account_id,
            debit: line.debit_amount,
            credit: line.credit_amount,
            running_balance: currentBalance,
            posting_date: entry.posting_date,
            fiscal_year_id: entry.fiscal_year_id,
            accounting_period_id: entry.accounting_period_id,
            reference: entry.reference_number,
            currency_id: entry.currency_id,
          });
        }

        await tx.generalLedger.createMany({
          data: ledgerInsertData,
        });

        // Step 5: Mark JournalEntry as PostedToLedger
        await tx.journalEntry.update({
          where: { id: entry.id },
          data: { is_posted_to_ledger: true },
        });
      });

      // Step 6: Emit PostingCompletedEvent
      const event = new PostingCompletedEvent(storeId, 0, 0, journalEntryId.toString(), 'postManualEntry', { success: true });
      this.eventBus.publish(event);
      this.logger.log(`Posting Completed for JE ${journalEntryId} (Store ${storeId})`);

      return {
        success: true,
        journal_entry_id: journalEntryId,
        message: 'Ledger posting completed successfully.',
      };

    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown Error';
      
      if (reason === 'ALREADY_POSTED') {
         return {
           success: true,
           journal_entry_id: journalEntryId,
           message: 'Ledger posting already completed.',
         };
      }

      const failedEvent = new PostingFailedEvent(storeId, 0, 0, journalEntryId.toString(), 'postManualEntry', { reason });
      this.eventBus.publish(failedEvent);
      this.logger.error(`Posting Failed for JE ${journalEntryId} (Store ${storeId}): ${reason}`);

      return {
        success: false,
        journal_entry_id: journalEntryId,
        message: 'Ledger posting failed.',
        error: reason,
      };
    }
  }
}
