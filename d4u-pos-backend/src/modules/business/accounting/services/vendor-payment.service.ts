import { Injectable } from '@nestjs/common';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { AccountsPayableValidator } from '../validators/accounts-payable.validator';
import { JournalEntryService } from './journal-entry.service';
import { VendorAgingService } from './vendor-aging.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CreateVendorPaymentInput } from '../interfaces/vendor-payment.interface';
import { VendorPaymentPostedEvent } from '../events/vendor-payment-posted.event';
import { randomUUID } from 'crypto';

@Injectable()
export class VendorPaymentService {
  constructor(
    private readonly repository: AccountsPayableRepository,
    private readonly validator: AccountsPayableValidator,
    private readonly journalService: JournalEntryService,
    private readonly agingService: VendorAgingService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async postPayment(input: CreateVendorPaymentInput, userId: number) {
    const payable = await this.validator.validatePayment(input);

    const paymentNumber = `PMT-${randomUUID().substring(0, 8).toUpperCase()}`;

    const journalDto: any = {
      fiscal_year_id: 1, // Look up real FY
      accounting_period_id: 1, // Look up real AP
      currency_id: 1,
      posting_date: new Date(),
      reference_number: paymentNumber,
      description: `Payment ${paymentNumber} for Invoice ${payable.purchase_invoice_id}`,
      lines: [
        {
          account_id: input.accounts_payable_account_id,
          debit_amount: input.amount,
          credit_amount: 0,
          description: 'Accounts Payable Debit'
        },
        {
          account_id: input.cash_bank_account_id,
          debit_amount: 0,
          credit_amount: input.amount,
          description: 'Cash / Bank Payment'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    const payment = await this.repository.createPayment({
      store_id: input.store_id,
      payable_id: input.payable_id,
      payment_number: paymentNumber,
      amount: input.amount,
      payment_method: input.payment_method,
      reference_number: input.reference_number,
      journal_entry_id: je.id
    });

    const newPaidAmount = Number(payable.paid_amount) + input.amount;
    const newOutstanding = Number(payable.outstanding_balance) - input.amount;
    const newStatus = newOutstanding <= 0 ? 'CLOSED' : 'PARTIAL';

    await this.repository.updatePayableBalance(payable.id, newPaidAmount, newOutstanding, newStatus);

    await this.agingService.calculateAging({ store_id: input.store_id, vendor_id: input.vendor_id }, userId);

    this.eventBus.publish(new VendorPaymentPostedEvent(
      input.store_id, 0, userId, payment.id.toString(), 'payment_posted', { amount: input.amount, payment_number: paymentNumber }
    ));

    return payment;
  }
}
