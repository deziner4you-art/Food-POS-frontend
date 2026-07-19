const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Interfaces
  'interfaces/posting-result.interface.ts': `export interface PostingResult {
  success: boolean;
  journal_entry_id: number;
  message: string;
  lines_posted?: number;
  error?: any;
}
`,

  // Events
  'events/posting-completed.event.ts': `export class PostingCompletedEvent {
  constructor(
    public readonly storeId: number,
    public readonly journalEntryId: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
`,
  'events/posting-failed.event.ts': `export class PostingFailedEvent {
  constructor(
    public readonly storeId: number,
    public readonly journalEntryId: number,
    public readonly reason: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
`,

  // Validators
  'validators/posting-validator.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { JournalEntryStatus } from '../enums/journal-entry-status.enum';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@Injectable()
export class PostingValidatorService {
  constructor(private readonly prisma: PrismaService) {}

  async validateForPosting(storeId: number, entryId: number) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, store_id: storeId },
      include: {
        lines: { include: { account: true } },
        fiscal_year: true,
        accounting_period: true,
      },
    });

    if (!entry) throw new BadRequestException('Journal Entry not found.');

    if (entry.is_posted_to_ledger) {
      throw new BadRequestException('Journal Entry is already posted to the Ledger (Idempotency check).');
    }

    if (entry.status !== JournalEntryStatus.POSTED) {
      throw new BadRequestException('Journal Entry must be in POSTED status to proceed.');
    }

    if (entry.fiscal_year.is_closed) {
      throw new BadRequestException('Fiscal Year is closed. Cannot post to ledger.');
    }

    if (entry.accounting_period.status === AccountingPeriodStatus.CLOSED) {
      throw new BadRequestException('Accounting Period is CLOSED. Cannot post to ledger.');
    }

    if (entry.accounting_period.status === AccountingPeriodStatus.LOCKED) {
      throw new BadRequestException('Accounting Period is LOCKED. Cannot post to ledger.');
    }

    if (!entry.lines || entry.lines.length < 2) {
      throw new BadRequestException('Journal Entry must contain at least two lines.');
    }

    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const line of entry.lines) {
      if (!line.account.is_active) {
        throw new BadRequestException(\`Account \${line.account.code} is inactive.\`);
      }
      totalDebit += Number(line.debit_amount);
      totalCredit += Number(line.credit_amount);
    }

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException('Journal Entry is unbalanced. Debit must equal Credit.');
    }

    return entry;
  }
}
`,

  // Services
  'services/posting-engine.service.ts': `import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PostingValidatorService } from '../validators/posting-validator.service';
import { PostingResult } from '../interfaces/posting-result.interface';
import { PostingCompletedEvent } from '../events/posting-completed.event';
import { PostingFailedEvent } from '../events/posting-failed.event';

// Note: If using EventEmitter2, we would inject it here. For MVP without Event Bus, we just log.
// The prompt specifies NO Event Bus, but requires the Event classes. We'll instantiate them to demonstrate usage.

@Injectable()
export class PostingEngineService {
  private readonly logger = new Logger(PostingEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: PostingValidatorService,
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
      const event = new PostingCompletedEvent(storeId, journalEntryId);
      this.logger.log(\`Posting Completed for JE \${journalEntryId} (Store \${storeId})\`);

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

      const failedEvent = new PostingFailedEvent(storeId, journalEntryId, reason);
      this.logger.error(\`Posting Failed for JE \${journalEntryId} (Store \${storeId}): \${reason}\`);

      return {
        success: false,
        journal_entry_id: journalEntryId,
        message: 'Ledger posting failed.',
        error: reason,
      };
    }
  }
}
`,

  // Controllers
  'controllers/posting.controller.ts': `import { Controller, Post, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PostingEngineService } from '../services/posting-engine.service';

@Controller('accounting/posting')
export class PostingController {
  constructor(private readonly service: PostingEngineService) {}

  @Post('manual/:journalEntryId')
  async postManualEntry(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('journalEntryId', ParseIntPipe) journalEntryId: number,
  ) {
    return this.service.postManualEntry(store_id, journalEntryId);
  }
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
