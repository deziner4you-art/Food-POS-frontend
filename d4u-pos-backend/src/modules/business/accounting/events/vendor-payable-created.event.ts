import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class VendorPayableCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'VENDOR_PAYABLE_CREATED';
  occurred_at = new Date();
  entity_type = 'VENDOR_PAYABLE';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
