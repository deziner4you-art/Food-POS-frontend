import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { TrialBalanceFilter } from '../interfaces/trial-balance-filter.interface';

@Injectable()
export class TrialBalanceValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateFilters(filter: TrialBalanceFilter) {
    if (filter.start_date > filter.end_date) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const fiscalYear = await this.prisma.fiscalYear.findUnique({ where: { id: filter.fiscal_year_id } });
    if (!fiscalYear) throw new BadRequestException('Fiscal year not found.');

    if (filter.accounting_period_id) {
      const period = await this.prisma.accountingPeriod.findUnique({ where: { id: filter.accounting_period_id } });
      if (!period) throw new BadRequestException('Accounting period not found.');
    }

    return filter;
  }
}
