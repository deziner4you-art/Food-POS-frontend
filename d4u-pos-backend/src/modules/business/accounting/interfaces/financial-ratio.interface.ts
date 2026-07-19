export interface FinancialRatios {
  gross_margin_pct: number;
  net_margin_pct: number;
  operating_margin_pct: number;
  current_ratio: number;
  quick_ratio: number;
  inventory_turnover: number;
  return_on_assets_pct: number;
  return_on_equity_pct: number;
}

export interface RatioResult {
  store_id: number;
  start_date: Date;
  end_date: Date;
  ratios: FinancialRatios;
  generated_date: Date;
}
