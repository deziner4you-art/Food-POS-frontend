export interface BudgetLineInput {
  account_id?: number;
  account_group_id?: number;
  amount: number;
  notes?: string;
}

export interface CreateBudgetInput {
  store_id: number;
  fiscal_year_id: number;
  name: string;
  type: string; // ANNUAL, MONTHLY, DEPARTMENT
  lines: BudgetLineInput[];
}

export interface BudgetResult {
  id: number;
  store_id: number;
  name: string;
  type: string;
  status: string;
  version: number;
  total_amount: number;
}
