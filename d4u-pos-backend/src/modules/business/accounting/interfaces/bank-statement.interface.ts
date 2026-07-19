export interface ImportStatementInput {
  store_id: number;
  account_id: number;
  statement_date: Date;
  opening_balance: number;
  closing_balance: number;
  lines: Array<{
    transaction_date: Date;
    description: string;
    reference_number?: string;
    amount: number;
  }>;
}
