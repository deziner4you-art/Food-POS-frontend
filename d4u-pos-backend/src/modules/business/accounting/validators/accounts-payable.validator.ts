import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { CreatePayableInput } from '../interfaces/accounts-payable.interface';
import { CreateVendorPaymentInput } from '../interfaces/vendor-payment.interface';

@Injectable()
export class AccountsPayableValidator {
  constructor(private readonly repository: AccountsPayableRepository) {}

  async validatePayable(input: CreatePayableInput) {
    if (!input.purchase_invoice_id) throw new BadRequestException('Purchase Invoice ID is required');
    if (input.total_amount <= 0) throw new BadRequestException('Amount must be > 0');

    const vendor = await this.repository.getVendor(input.vendor_id);
    if (!vendor) throw new BadRequestException('Invalid Vendor');
  }

  async validatePayment(input: CreateVendorPaymentInput) {
    if (input.amount <= 0) throw new BadRequestException('Payment amount must be > 0');
    
    const payable = await this.repository.getPayable(input.payable_id);
    if (!payable) throw new BadRequestException('Payable not found');
    if (payable.vendor_id !== input.vendor_id) throw new BadRequestException('Payable belongs to another vendor');
    
    if (Number(payable.outstanding_balance) < input.amount) {
      throw new BadRequestException('Payment amount cannot exceed outstanding balance');
    }
    
    return payable;
  }
}
