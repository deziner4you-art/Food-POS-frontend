export interface KpiFilter {
  fiscal_year_id: number;
  accounting_period_id?: number;
  start_date: Date;
  end_date: Date;
  store_id: number;
}

export interface FinancialKpis {
  revenue: number;
  gross_profit: number;
  net_profit: number;
  ebit: number;
  ebitda: number;
  working_capital: number;
  current_assets: number;
  current_liabilities: number;
  average_inventory: number;
  accounts_receivable: number;
  accounts_payable: number;
  cash_position: number;
  operating_cash_flow: number;
}

export interface KpiResult {
  store_id: number;
  start_date: Date;
  end_date: Date;
  kpis: FinancialKpis;
  generated_date: Date;
}
