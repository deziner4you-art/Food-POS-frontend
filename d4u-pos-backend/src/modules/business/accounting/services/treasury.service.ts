import { Injectable } from '@nestjs/common';
import { TreasuryRepository } from '../repositories/treasury.repository';
import { JournalEntryService } from './journal-entry.service';
import { CashPositionService } from './cash-position.service';
import { CreateCashTransactionInput } from '../interfaces/treasury.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';

@Injectable()
export class TreasuryService {
  constructor(
    private readonly repository: TreasuryRepository,
    private readonly journalService: JournalEntryService,
    private readonly positionService: CashPositionService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createCashAdjustment(input: CreateCashTransactionInput, userId: number) {
    const account = await this.repository.getBankAccount(input.bank_account_id);
    if (!account) throw new Error('Bank account not found');

    let jeId = null;
    if (input.adjustment_account_id) {
      const journalDto: any = {
        fiscal_year_id: 1, 
        accounting_period_id: 1,
        currency_id: 1,
        posting_date: new Date(),
        reference_number: `CA-${Date.now()}`,
        description: input.description,
        lines: [
          {
            account_id: account.account_id,
            debit_amount: input.transaction_type === 'INFLOW' ? input.amount : 0,
            credit_amount: input.transaction_type === 'OUTFLOW' ? input.amount : 0,
            description: 'Bank Cash Adjustment'
          },
          {
            account_id: input.adjustment_account_id,
            debit_amount: input.transaction_type === 'OUTFLOW' ? input.amount : 0,
            credit_amount: input.transaction_type === 'INFLOW' ? input.amount : 0,
            description: 'Adjustment Offset'
          }
        ]
      };

      const je = await this.journalService.create(input.store_id, journalDto);
      await this.journalService.submit(input.store_id, je.id);
      await this.journalService.approve(input.store_id, je.id);
      jeId = je.id;
    }

    const newBalance = input.transaction_type === 'INFLOW' 
      ? Number(account.current_balance) + input.amount 
      : Number(account.current_balance) - input.amount;

    await this.repository.updateBankAccountBalance(account.id, newBalance);

    const txn = await this.repository.createCashTransaction({
      store_id: input.store_id,
      bank_account_id: input.bank_account_id,
      transaction_type: input.transaction_type,
      amount: input.amount,
      description: input.description,
      reference_type: input.reference_type,
      reference_id: input.reference_id,
      journal_entry_id: jeId
    });

    await this.positionService.updateCashPosition({ store_id: input.store_id, bank_account_id: input.bank_account_id }, userId);

    return txn;
  }

  async getBankAccounts(storeId: number) {
    return this.repository.getBankAccounts(storeId);
  }
}
