export interface PostingContext {
  store_id: number;
  tenant_id: number;
  event_type: string;
  amount: number;
  currency_id?: number;
  tax_amount?: number;
  reference_id?: string;
  metadata?: Record<string, any>;
}
