import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class CashForecastGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'CASH_FORECAST_GENERATED';
  occurred_at = new Date();
  entity_type = 'CASH_FORECAST';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
