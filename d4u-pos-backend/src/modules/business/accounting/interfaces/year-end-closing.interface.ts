export interface YearEndClosingInput {
  store_id: number;
  fiscal_year_id: number;
  retained_earnings_account_id: number;
}

export interface YearEndClosingResult {
  id: number;
  store_id: number;
  fiscal_year_id: number;
  status: string;
  started_at?: Date | null;
  completed_at?: Date | null;
}
