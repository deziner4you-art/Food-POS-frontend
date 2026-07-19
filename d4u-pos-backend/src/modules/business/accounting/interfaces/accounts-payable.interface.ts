export interface CreatePayableInput {
  store_id: number;
  vendor_id: number;
  purchase_invoice_id: string;
  invoice_date: Date;
  due_date: Date;
  total_amount: number;
  accounts_payable_account_id: number;
  inventory_expense_account_id: number;
}
