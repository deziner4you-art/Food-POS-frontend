import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class WarehouseTransferReceivedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'WAREHOUSE_TRANSFER_RECEIVED';
  occurred_at = new Date();
  entity_type = 'WAREHOUSE_TRANSFER';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
