import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountsReceivableRepository } from '../repositories/accounts-receivable.repository';
import { CreateReceivableInput } from '../interfaces/accounts-receivable.interface';
import { CreateReceiptInput } from '../interfaces/customer-receipt.interface';

@Injectable()
export class AccountsReceivableValidator {
  constructor(private readonly repository: AccountsReceivableRepository) {}

  async validateReceivable(input: CreateReceivableInput) {
    if (!input.invoice_id) throw new BadRequestException('Invoice ID is required');
    if (input.total_amount <= 0) throw new BadRequestException('Amount must be > 0');

    const customer = await this.repository.getCustomer(input.customer_id);
    if (!customer) throw new BadRequestException('Invalid Customer');

    const limit = await this.repository.getCreditLimit(input.store_id, input.customer_id);
    if (limit && limit.is_active && Number(limit.available_credit) < input.total_amount) {
      throw new BadRequestException('Credit limit exceeded');
    }
  }

  async validateReceipt(input: CreateReceiptInput) {
    if (input.amount <= 0) throw new BadRequestException('Receipt amount must be > 0');
    
    const receivable = await this.repository.getReceivable(input.receivable_id);
    if (!receivable) throw new BadRequestException('Receivable not found');
    if (receivable.customer_id !== input.customer_id) throw new BadRequestException('Receivable belongs to another customer');
    
    if (Number(receivable.outstanding_balance) < input.amount) {
      throw new BadRequestException('Receipt amount cannot exceed outstanding balance');
    }
    
    return receivable;
  }
}
