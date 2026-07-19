import { Injectable, BadRequestException } from '@nestjs/common';
import { BalanceSheetRepository } from '../repositories/balance-sheet.repository';
import { BalanceSheetFilter } from '../interfaces/balance-sheet-filter.interface';

@Injectable()
export class BalanceSheetValidator {
  constructor(private readonly repository: BalanceSheetRepository) {}

  async validateFilters(filter: BalanceSheetFilter) {
    const statement = await this.repository.getBalanceSheetStatementDef(filter.store_id);
    if (!statement) {
      throw new BadRequestException('Balance Sheet statement mapping not configured for this store.');
    }

    const fiscalYear = await this.repository.getFiscalYear(filter.fiscal_year_id);
    if (!fiscalYear) {
      throw new BadRequestException('Fiscal Year not found.');
    }

    return { filter, statement, fiscalYear };
  }
}
