import { DomainEvent } from './domain-event.interface';
import { EVENT_REGISTRY } from './event-registry';
import { randomUUID } from 'crypto';

export class JournalEntryPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = EVENT_REGISTRY.JOURNAL_ENTRY_POSTED;
  occurred_at = new Date();

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
  entity_type = 'JOURNAL_ENTRY';
}
