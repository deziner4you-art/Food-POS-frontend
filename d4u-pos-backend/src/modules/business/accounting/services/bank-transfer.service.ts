import { Injectable } from '@nestjs/common';
import { TreasuryRepository } from '../repositories/treasury.repository';
import { TreasuryValidator } from '../validators/treasury.validator';
import { JournalEntryService } from './journal-entry.service';
import { CashPositionService } from './cash-position.service';
import { BankTransferInput } from '../interfaces/bank-transfer.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BankTransferCompletedEvent } from '../events/bank-transfer-completed.event';
import { randomUUID } from 'crypto';

@Injectable()
export class BankTransferService {
  constructor(
    private readonly repository: TreasuryRepository,
    private readonly validator: TreasuryValidator,
    private readonly journalService: JournalEntryService,
    private readonly positionService: CashPositionService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async transfer(input: BankTransferInput, userId: number) {
    const { source, dest } = await this.validator.validateBankTransfer(input);

    const refNo = `TRF-${randomUUID().substring(0, 8).toUpperCase()}`;

    const journalDto: any = {
      fiscal_year_id: 1, 
      accounting_period_id: 1,
      currency_id: 1,
      posting_date: new Date(),
      reference_number: refNo,
      description: input.description || `Inter-bank transfer from ${source.bank_name} to ${dest.bank_name}`,
      lines: [
        {
          account_id: dest.account_id,
          debit_amount: input.amount,
          credit_amount: 0,
          description: 'Transfer IN'
        },
        {
          account_id: source.account_id,
          debit_amount: 0,
          credit_amount: input.amount,
          description: 'Transfer OUT'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    // Update source
    await this.repository.updateBankAccountBalance(source.id, Number(source.current_balance) - input.amount);
    await this.repository.createCashTransaction({
      store_id: input.store_id,
      bank_account_id: source.id,
      transaction_type: 'OUTFLOW',
      amount: input.amount,
      description: `Transfer to ${dest.bank_name}`,
      reference_type: 'TRANSFER',
      reference_id: refNo,
      journal_entry_id: je.id
    });

    // Update dest
    await this.repository.updateBankAccountBalance(dest.id, Number(dest.current_balance) + input.amount);
    await this.repository.createCashTransaction({
      store_id: input.store_id,
      bank_account_id: dest.id,
      transaction_type: 'INFLOW',
      amount: input.amount,
      description: `Transfer from ${source.bank_name}`,
      reference_type: 'TRANSFER',
      reference_id: refNo,
      journal_entry_id: je.id
    });

    const transfer = await this.repository.createBankTransfer({
      store_id: input.store_id,
      source_account_id: source.id,
      destination_account_id: dest.id,
      amount: input.amount,
      reference_number: refNo,
      description: input.description,
      journal_entry_id: je.id,
      created_by: userId
    });

    await this.positionService.updateCashPosition({ store_id: input.store_id, bank_account_id: source.id }, userId);
    await this.positionService.updateCashPosition({ store_id: input.store_id, bank_account_id: dest.id }, userId);

    this.eventBus.publish(new BankTransferCompletedEvent(
      input.store_id, 0, userId, transfer.id.toString(), 'transfer_completed', { amount: input.amount }
    ));

    return transfer;
  }
}
