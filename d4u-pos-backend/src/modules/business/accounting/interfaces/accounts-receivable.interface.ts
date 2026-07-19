export interface CreateReceivableInput {
  store_id: number;
  customer_id: number;
  invoice_id: string;
  invoice_date: Date;
  due_date: Date;
  total_amount: number;
  accounts_receivable_account_id: number;
  sales_revenue_account_id: number;
}
