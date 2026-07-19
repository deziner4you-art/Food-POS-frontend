import { Injectable, BadRequestException } from '@nestjs/common';
import { CashFlowRepository } from '../repositories/cash-flow.repository';
import { CashFlowFilter } from '../interfaces/cash-flow-filter.interface';

@Injectable()
export class CashFlowValidator {
  constructor(private readonly repository: CashFlowRepository) {}

  async validateFilters(filter: CashFlowFilter) {
    if (filter.start_date > filter.end_date) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const statement = await this.repository.getCashFlowStatementDef(filter.store_id);
    if (!statement) {
      throw new BadRequestException('Cash Flow statement mapping not configured for this store.');
    }

    const cashAccounts = await this.repository.getCashAccounts(filter.store_id);
    if (!cashAccounts || cashAccounts.length === 0) {
      // We don't block, but it's good to know.
    }

    return { filter, statement, cashAccounts };
  }
}
