export interface DashboardFilter {
  fiscal_year_id: number;
  accounting_period_id?: number;
  start_date: Date;
  end_date: Date;
  store_id: number;
}

export interface DashboardKPIs {
  revenue: number;
  gross_profit: number;
  net_profit: number;
  cash_balance: number;
  inventory_value: number;
  accounts_receivable: number;
  accounts_payable: number;
  working_capital: number;
  gross_margin_pct: number;
  net_margin_pct: number;
  current_ratio: number;
  quick_ratio: number;
}

export interface TrendDataPoint {
  label: string;
  revenue: number;
  expense: number;
  profit: number;
  cash: number;
  inventory: number;
}

export interface FinancialDashboardResult {
  store_id: number;
  start_date: Date;
  end_date: Date;
  kpis: DashboardKPIs;
  trends: TrendDataPoint[];
  generated_date: Date;
}
