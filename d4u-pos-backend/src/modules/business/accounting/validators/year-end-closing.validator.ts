import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { YearEndClosingInput } from '../interfaces/year-end-closing.interface';

@Injectable()
export class YearEndClosingValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateReadiness(input: YearEndClosingInput) {
    if (!input.store_id || !input.fiscal_year_id || !input.retained_earnings_account_id) {
      throw new BadRequestException('store_id, fiscal_year_id, and retained_earnings_account_id are required');
    }

    const periods = await this.prisma.accountingPeriod.findMany({
      where: { fiscal_year_id: input.fiscal_year_id },
      include: { PeriodClosing: true }
    });

    const openPeriods = periods.filter(p => !p.PeriodClosing || !['CLOSED', 'LOCKED'].includes(p.PeriodClosing.status));

    if (openPeriods.length > 0) {
      throw new BadRequestException(`Cannot close year. Found ${openPeriods.length} open accounting periods.`);
    }

    const draftJournals = await this.prisma.journalEntry.count({
      where: { fiscal_year_id: input.fiscal_year_id, is_posted_to_ledger: false }
    });

    if (draftJournals > 0) {
      throw new BadRequestException('Cannot close year. Unposted journal entries found.');
    }
    
    // Ensure account exists
    const account = await this.prisma.account.findUnique({ where: { id: input.retained_earnings_account_id } });
    if (!account) {
      throw new BadRequestException('Retained earnings account not found');
    }
  }
}
