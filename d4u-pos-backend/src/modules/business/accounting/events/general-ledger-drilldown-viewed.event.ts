import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class GeneralLedgerDrillDownViewedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'GENERAL_LEDGER_DRILLDOWN_VIEWED';
  occurred_at = new Date();
  entity_type = 'REPORT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
