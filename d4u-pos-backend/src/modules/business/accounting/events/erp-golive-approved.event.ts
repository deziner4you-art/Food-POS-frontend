import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class ERPGoLiveApprovedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'ERP_GOLIVE_APPROVED';
  occurred_at = new Date();
  entity_type = 'SYSTEM_CERTIFICATION';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
