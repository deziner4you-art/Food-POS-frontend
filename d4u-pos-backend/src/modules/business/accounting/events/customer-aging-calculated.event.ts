import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class CustomerAgingCalculatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'CUSTOMER_AGING_CALCULATED';
  occurred_at = new Date();
  entity_type = 'CUSTOMER_AGING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
