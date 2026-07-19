import { Injectable, BadRequestException } from '@nestjs/common';
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
        throw new BadRequestException(`Account ${line.account.code} is inactive.`);
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
