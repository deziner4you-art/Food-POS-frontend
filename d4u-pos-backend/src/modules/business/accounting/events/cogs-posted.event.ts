import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class COGSPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'COGS_POSTED';
  occurred_at = new Date();
  entity_type = 'ACCOUNTING_POSTING';

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
}
