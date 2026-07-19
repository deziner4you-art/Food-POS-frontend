import { DomainEvent } from './domain-event.interface';
import { EVENT_REGISTRY } from './event-registry';
import { randomUUID } from 'crypto';

export class POSSalePostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'POS_SALE_POSTED';
  occurred_at = new Date();
  entity_type = 'ORDER';

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
}
