export interface CreateCashTransactionInput {
  store_id: number;
  bank_account_id: number;
  transaction_type: 'INFLOW' | 'OUTFLOW';
  amount: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  adjustment_account_id?: number; // Needed if creating journal entry manually for standalone cash adjustment
}
