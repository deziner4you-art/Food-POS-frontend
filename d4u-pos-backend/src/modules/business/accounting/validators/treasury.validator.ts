import { Injectable, BadRequestException } from '@nestjs/common';
import { TreasuryRepository } from '../repositories/treasury.repository';
import { BankTransferInput } from '../interfaces/bank-transfer.interface';

@Injectable()
export class TreasuryValidator {
  constructor(private readonly repository: TreasuryRepository) {}

  async validateBankTransfer(input: BankTransferInput) {
    if (input.source_account_id === input.destination_account_id) {
      throw new BadRequestException('Source and destination accounts must be different');
    }
    if (input.amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than 0');
    }

    const source = await this.repository.getBankAccount(input.source_account_id);
    if (!source || !source.is_active) throw new BadRequestException('Invalid or inactive source account');

    const dest = await this.repository.getBankAccount(input.destination_account_id);
    if (!dest || !dest.is_active) throw new BadRequestException('Invalid or inactive destination account');

    if (Number(source.current_balance) < input.amount) {
      throw new BadRequestException('Insufficient funds in source account');
    }

    return { source, dest };
  }
}
