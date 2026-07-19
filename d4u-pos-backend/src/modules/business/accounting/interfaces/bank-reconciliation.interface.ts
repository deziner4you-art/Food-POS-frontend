export interface RunReconciliationInput {
  store_id: number;
  statement_id: number;
}

export interface MatchTransactionInput {
  store_id: number;
  statement_line_id: number;
  journal_line_id: number;
}

export interface CreateAdjustmentInput {
  store_id: number;
  reconciliation_id: number;
  amount: number;
  reason: string;
  adjustment_account_id: number;
  statement_account_id: number;
}

export interface BankReconciliationResult {
  matched_count: number;
  unmatched_count: number;
  matched_amount: number;
  unmatched_amount: number;
}
