import { Injectable } from '@nestjs/common';
import { AccountsReceivableRepository } from '../repositories/accounts-receivable.repository';
import { AccountsReceivableValidator } from '../validators/accounts-receivable.validator';
import { JournalEntryService } from './journal-entry.service';
import { CustomerAgingService } from './customer-aging.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CreateReceiptInput } from '../interfaces/customer-receipt.interface';
import { CustomerReceiptPostedEvent } from '../events/customer-receipt-posted.event';
import { randomUUID } from 'crypto';

@Injectable()
export class CustomerReceiptService {
  constructor(
    private readonly repository: AccountsReceivableRepository,
    private readonly validator: AccountsReceivableValidator,
    private readonly journalService: JournalEntryService,
    private readonly agingService: CustomerAgingService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async postReceipt(input: CreateReceiptInput, userId: number) {
    const receivable = await this.validator.validateReceipt(input);

    const receiptNumber = `RCT-${randomUUID().substring(0, 8).toUpperCase()}`;

    const journalDto: any = {
      fiscal_year_id: 1, // Look up real FY
      accounting_period_id: 1, // Look up real AP
      currency_id: 1,
      posting_date: new Date(),
      reference_number: receiptNumber,
      description: `Receipt ${receiptNumber} for Invoice ${receivable.invoice_id}`,
      lines: [
        {
          account_id: input.cash_bank_account_id,
          debit_amount: input.amount,
          credit_amount: 0,
          description: 'Cash / Bank Receipt'
        },
        {
          account_id: input.accounts_receivable_account_id,
          debit_amount: 0,
          credit_amount: input.amount,
          description: 'Accounts Receivable Credit'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    const receipt = await this.repository.createReceipt({
      store_id: input.store_id,
      receivable_id: input.receivable_id,
      receipt_number: receiptNumber,
      amount: input.amount,
      payment_method: input.payment_method,
      reference_number: input.reference_number,
      journal_entry_id: je.id
    });

    const newPaidAmount = Number(receivable.paid_amount) + input.amount;
    const newOutstanding = Number(receivable.outstanding_balance) - input.amount;
    const newStatus = newOutstanding <= 0 ? 'CLOSED' : 'PARTIAL';

    await this.repository.updateReceivableBalance(receivable.id, newPaidAmount, newOutstanding, newStatus);

    await this.agingService.calculateAging({ store_id: input.store_id, customer_id: input.customer_id }, userId);

    this.eventBus.publish(new CustomerReceiptPostedEvent(
      input.store_id, 0, userId, receipt.id.toString(), 'receipt_posted', { amount: input.amount, receipt_number: receiptNumber }
    ));

    return receipt;
  }
}
