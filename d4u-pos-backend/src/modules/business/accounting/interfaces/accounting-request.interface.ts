export interface AccountingRequest {
  tenant_id: number;
  store_id: number;
  business_module: string;
  business_event: string;
  business_document_id: string;
  document_number: string;
  transaction_date: Date;
  currency_id?: number;
  user_id: number;
  reference: string;
  amount: number;
  tax_amount?: number;
  metadata?: Record<string, any>;
}
