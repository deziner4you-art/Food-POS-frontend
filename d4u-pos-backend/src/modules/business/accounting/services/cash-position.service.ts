import { Injectable } from '@nestjs/common';
import { TreasuryRepository } from '../repositories/treasury.repository';
import { CalculateCashPositionInput } from '../interfaces/cash-position.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CashPositionUpdatedEvent } from '../events/cash-position-updated.event';

@Injectable()
export class CashPositionService {
  constructor(
    private readonly repository: TreasuryRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async updateCashPosition(input: CalculateCashPositionInput, userId: number) {
    const account = await this.repository.getBankAccount(input.bank_account_id);
    if (!account) return;

    // Ideally, we'd calculate net change since last snapshot. 
    // Here we just snap the current balance.
    const pos = await this.repository.upsertCashPosition(input.store_id, input.bank_account_id, {
      opening_balance: account.current_balance, // simplistic snapshot
      closing_balance: account.current_balance,
      net_change: 0
    });

    this.eventBus.publish(new CashPositionUpdatedEvent(
      input.store_id, 0, userId, pos.id.toString(), 'position_updated', { balance: account.current_balance }
    ));

    return pos;
  }
}
