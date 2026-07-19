import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FinancialReportExportedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FINANCIAL_REPORT_EXPORTED';
  occurred_at = new Date();
  entity_type = 'REPORT_EXPORT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
