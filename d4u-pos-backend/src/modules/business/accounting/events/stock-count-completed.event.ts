import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class StockCountCompletedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'STOCK_COUNT_COMPLETED';
  occurred_at = new Date();
  entity_type = 'STOCK_COUNT';

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
}
