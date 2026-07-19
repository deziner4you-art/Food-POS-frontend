import { Injectable, BadRequestException } from '@nestjs/common';
import { ProfitLossRepository } from '../repositories/profit-loss.repository';
import { ProfitLossFilter } from '../interfaces/profit-loss-filter.interface';

@Injectable()
export class ProfitLossValidator {
  constructor(private readonly repository: ProfitLossRepository) {}

  async validateFilters(filter: ProfitLossFilter) {
    if (filter.start_date > filter.end_date) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const statement = await this.repository.getProfitLossStatementDef(filter.store_id);
    if (!statement) {
      throw new BadRequestException('Profit & Loss statement mapping not configured for this store.');
    }

    return { filter, statement };
  }
}
