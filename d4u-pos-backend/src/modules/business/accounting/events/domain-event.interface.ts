export interface DomainEvent<T = any> {
  event_id: string;
  event_name: string;
  occurred_at: Date;
  store_id: number;
  tenant_id: number;
  user_id: number;
  entity_type: string;
  entity_id: string;
  correlation_id: string;
  payload: T;
}
