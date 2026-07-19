export interface CreateReceiptInput {
  store_id: number;
  customer_id: number;
  receivable_id: number;
  amount: number;
  payment_method: string;
  reference_number?: string;
  cash_bank_account_id: number;
  accounts_receivable_account_id: number;
}
