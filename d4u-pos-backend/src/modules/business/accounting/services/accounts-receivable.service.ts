import { Injectable } from '@nestjs/common';
import { AccountsReceivableRepository } from '../repositories/accounts-receivable.repository';
import { AccountsReceivableValidator } from '../validators/accounts-receivable.validator';
import { JournalEntryService } from './journal-entry.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CreateReceivableInput } from '../interfaces/accounts-receivable.interface';
import { CustomerReceivableCreatedEvent } from '../events/customer-receivable-created.event';

@Injectable()
export class AccountsReceivableService {
  constructor(
    private readonly repository: AccountsReceivableRepository,
    private readonly validator: AccountsReceivableValidator,
    private readonly journalService: JournalEntryService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createReceivable(input: CreateReceivableInput, userId: number) {
    await this.validator.validateReceivable(input);

    const journalDto: any = {
      fiscal_year_id: 1, // Look up real FY based on invoice_date
      accounting_period_id: 1, // Look up real AP
      currency_id: 1,
      posting_date: new Date(input.invoice_date),
      reference_number: `INV-${input.invoice_id}`,
      description: `Credit Sale Invoice ${input.invoice_id}`,
      lines: [
        {
          account_id: input.accounts_receivable_account_id,
          debit_amount: input.total_amount,
          credit_amount: 0,
          description: 'Accounts Receivable'
        },
        {
          account_id: input.sales_revenue_account_id,
          debit_amount: 0,
          credit_amount: input.total_amount,
          description: 'Sales Revenue'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    const receivable = await this.repository.createReceivable({
      store_id: input.store_id,
      customer_id: input.customer_id,
      invoice_id: input.invoice_id,
      invoice_date: new Date(input.invoice_date),
      due_date: new Date(input.due_date),
      total_amount: input.total_amount,
      outstanding_balance: input.total_amount,
      status: 'OPEN',
      journal_entry_id: je.id
    });

    this.eventBus.publish(new CustomerReceivableCreatedEvent(
      input.store_id, 0, userId, receivable.id.toString(), 'receivable_created', { invoice_id: input.invoice_id, amount: input.total_amount }
    ));

    return receivable;
  }

  async getReceivables(storeId: number) {
    // Basic getter, normally you'd implement pagination
    // returning empty or mock for blueprint
    return [];
  }

  async getCustomerReceivables(storeId: number, customerId: number) {
    return this.repository.getReceivablesByCustomer(storeId, customerId);
  }
}
