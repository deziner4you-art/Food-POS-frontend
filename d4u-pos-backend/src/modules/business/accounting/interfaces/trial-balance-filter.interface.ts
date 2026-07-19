export interface TrialBalanceFilter {
  fiscal_year_id: number;
  accounting_period_id?: number;
  start_date: Date;
  end_date: Date;
  store_id: number;
  warehouse_id?: number;
  cost_center_id?: number;
  account_type?: string;
  currency?: string;
}
