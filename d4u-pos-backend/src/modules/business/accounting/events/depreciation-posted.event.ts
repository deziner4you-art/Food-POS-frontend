import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class DepreciationPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'DEPRECIATION_POSTED';
  occurred_at = new Date();
  entity_type = 'DEPRECIATION_POSTING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
