import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class CustomerReceivableCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'CUSTOMER_RECEIVABLE_CREATED';
  occurred_at = new Date();
  entity_type = 'CUSTOMER_RECEIVABLE';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
