export interface TrialBalanceLine {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  opening_debit: number;
  opening_credit: number;
  period_debit: number;
  period_credit: number;
  closing_debit: number;
  closing_credit: number;
  net_balance: number;
}

export interface TrialBalanceResult {
  store_id: number;
  start_date: Date;
  end_date: Date;
  lines: TrialBalanceLine[];
  total_opening_debit: number;
  total_opening_credit: number;
  total_period_debit: number;
  total_period_credit: number;
  total_closing_debit: number;
  total_closing_credit: number;
}
