import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { GeneralLedgerFilter } from '../interfaces/general-ledger-filter.interface';

@Injectable()
export class GeneralLedgerValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateFilters(filter: GeneralLedgerFilter) {
    if (filter.start_date > filter.end_date) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    if (filter.account_id) {
      const account = await this.prisma.account.findUnique({ where: { id: filter.account_id } });
      if (!account) throw new BadRequestException('Account not found.');
    }

    return filter;
  }
}
