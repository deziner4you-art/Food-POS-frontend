import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class MonthEndClosingCompletedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'MONTH_END_CLOSING_COMPLETED';
  occurred_at = new Date();
  entity_type = 'MONTH_END_CLOSING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
