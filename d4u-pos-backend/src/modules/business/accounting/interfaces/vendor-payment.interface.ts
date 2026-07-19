export interface CreateVendorPaymentInput {
  store_id: number;
  vendor_id: number;
  payable_id: number;
  amount: number;
  payment_method: string;
  reference_number?: string;
  cash_bank_account_id: number;
  accounts_payable_account_id: number;
}
