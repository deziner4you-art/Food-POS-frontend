export interface PurchaseItemPayload {
  item_id: number;
  quantity: number;
  unit_cost: number;
  tax: number;
  discount: number;
  total: number;
}

export interface PurchaseAccountingPayload {
  store_id: number;
  tenant_id?: number;
  warehouse_id: number;
  supplier_id: number;
  purchase_order_id?: string;
  grn_number?: string;
  invoice_number?: string;
  return_number?: string;
  currency_id?: number;
  items: PurchaseItemPayload[];
  total_amount: number;
  total_tax: number;
  total_discount: number;
  reference: string;
  created_by: number;
  transaction_date: Date;
}
