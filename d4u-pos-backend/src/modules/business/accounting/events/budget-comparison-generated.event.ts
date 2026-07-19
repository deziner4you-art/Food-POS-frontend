import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BudgetComparisonGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BUDGET_COMPARISON_GENERATED';
  occurred_at = new Date();
  entity_type = 'BUDGET_ANALYSIS';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
