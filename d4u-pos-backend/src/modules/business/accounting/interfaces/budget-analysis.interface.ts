export interface BudgetAnalysisFilter {
  store_id: number;
  fiscal_year_id: number;
  budget_id: number;
  start_date: Date;
  end_date: Date;
}

export interface BudgetAnalysisLine {
  account_code: string;
  account_name: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  variance_pct: number;
  status: 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TRACK';
}

export interface BudgetAnalysisResult {
  budget_id: number;
  store_id: number;
  fiscal_year_id: number;
  total_budget: number;
  total_actual: number;
  total_variance: number;
  total_variance_pct: number;
  lines: BudgetAnalysisLine[];
}
