import { DomainEvent } from './domain-event.interface';
import { EVENT_REGISTRY } from './event-registry';
import { randomUUID } from 'crypto';

export class VoucherApprovedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = EVENT_REGISTRY.VOUCHER_APPROVED;
  occurred_at = new Date();

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
  entity_type = 'VOUCHER';
}
