import { Injectable, BadRequestException } from '@nestjs/common';
import { BankReconciliationRepository } from '../repositories/bank-reconciliation.repository';
import { ImportStatementInput } from '../interfaces/bank-statement.interface';

@Injectable()
export class BankReconciliationValidator {
  constructor(private readonly repository: BankReconciliationRepository) {}

  async validateImport(input: ImportStatementInput) {
    if (!input.account_id) throw new BadRequestException('Bank Account ID is required');
    if (input.lines.length === 0) throw new BadRequestException('Statement must have at least one line');
    // More validations can be added (e.g. checking for overlapping dates for the same account)
  }

  async validateMatch(lineId: number, journalLineId: number) {
    // Normally check if either are already matched
  }
}
