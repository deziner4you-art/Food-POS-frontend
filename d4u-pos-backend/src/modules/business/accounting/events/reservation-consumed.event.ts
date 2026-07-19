import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class ReservationConsumedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'RESERVATION_CONSUMED';
  occurred_at = new Date();
  entity_type = 'INVENTORY_RESERVATION';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
