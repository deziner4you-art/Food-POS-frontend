import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class VendorPaymentPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'VENDOR_PAYMENT_POSTED';
  occurred_at = new Date();
  entity_type = 'VENDOR_PAYMENT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
