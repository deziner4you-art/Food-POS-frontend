import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FinancialKpiGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FINANCIAL_KPI_GENERATED';
  occurred_at = new Date();
  entity_type = 'KPI_REPORT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
