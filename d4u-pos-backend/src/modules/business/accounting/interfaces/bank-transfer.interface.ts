export interface BankTransferInput {
  store_id: number;
  source_account_id: number;
  destination_account_id: number;
  amount: number;
  description?: string;
}
