import { Injectable } from '@nestjs/common';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { AccountsPayableValidator } from '../validators/accounts-payable.validator';
import { JournalEntryService } from './journal-entry.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CreatePayableInput } from '../interfaces/accounts-payable.interface';
import { VendorPayableCreatedEvent } from '../events/vendor-payable-created.event';

@Injectable()
export class AccountsPayableService {
  constructor(
    private readonly repository: AccountsPayableRepository,
    private readonly validator: AccountsPayableValidator,
    private readonly journalService: JournalEntryService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createPayable(input: CreatePayableInput, userId: number) {
    await this.validator.validatePayable(input);

    const journalDto: any = {
      fiscal_year_id: 1, // Look up real FY based on invoice_date
      accounting_period_id: 1, // Look up real AP
      currency_id: 1,
      posting_date: new Date(input.invoice_date),
      reference_number: `PINV-${input.purchase_invoice_id}`,
      description: `Credit Purchase Invoice ${input.purchase_invoice_id}`,
      lines: [
        {
          account_id: input.inventory_expense_account_id,
          debit_amount: input.total_amount,
          credit_amount: 0,
          description: 'Inventory / Expense'
        },
        {
          account_id: input.accounts_payable_account_id,
          debit_amount: 0,
          credit_amount: input.total_amount,
          description: 'Accounts Payable'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    const payable = await this.repository.createPayable({
      store_id: input.store_id,
      vendor_id: input.vendor_id,
      purchase_invoice_id: input.purchase_invoice_id,
      invoice_date: new Date(input.invoice_date),
      due_date: new Date(input.due_date),
      total_amount: input.total_amount,
      outstanding_balance: input.total_amount,
      status: 'OPEN',
      journal_entry_id: je.id
    });

    this.eventBus.publish(new VendorPayableCreatedEvent(
      input.store_id, 0, userId, payable.id.toString(), 'payable_created', { purchase_invoice_id: input.purchase_invoice_id, amount: input.total_amount }
    ));

    return payable;
  }

  async getPayables(storeId: number) {
    return [];
  }

  async getVendorPayables(storeId: number, vendorId: number) {
    return this.repository.getPayablesByVendor(storeId, vendorId);
  }
}
