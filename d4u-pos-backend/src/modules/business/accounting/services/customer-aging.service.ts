import { Injectable } from '@nestjs/common';
import { AccountsReceivableRepository } from '../repositories/accounts-receivable.repository';
import { CalculateAgingInput } from '../interfaces/customer-aging.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CustomerAgingCalculatedEvent } from '../events/customer-aging-calculated.event';

@Injectable()
export class CustomerAgingService {
  constructor(
    private readonly repository: AccountsReceivableRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async calculateAging(input: CalculateAgingInput, userId: number) {
    const receivables = await this.repository.getOpenReceivables(input.store_id, input.customer_id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = 0;
    let days_1_30 = 0;
    let days_31_60 = 0;
    let days_61_90 = 0;
    let days_91_120 = 0;
    let days_over_120 = 0;
    let total_outstanding = 0;

    for (const rec of receivables) {
      const balance = Number(rec.outstanding_balance);
      total_outstanding += balance;

      const dueDate = new Date(rec.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        current += balance;
      } else if (diffDays <= 30) {
        days_1_30 += balance;
      } else if (diffDays <= 60) {
        days_31_60 += balance;
      } else if (diffDays <= 90) {
        days_61_90 += balance;
      } else if (diffDays <= 120) {
        days_91_120 += balance;
      } else {
        days_over_120 += balance;
      }
    }

    const aging = await this.repository.upsertAging(input.store_id, input.customer_id, {
      current,
      days_1_30,
      days_31_60,
      days_61_90,
      days_91_120,
      days_over_120,
      total_outstanding,
      calculated_at: new Date()
    });

    this.eventBus.publish(new CustomerAgingCalculatedEvent(
      input.store_id, 0, userId, aging.id.toString(), 'aging_calculated', { customer_id: input.customer_id, total: total_outstanding }
    ));

    return aging;
  }
}
