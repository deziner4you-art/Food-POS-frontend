export interface ComparativeFilter {
  report_type: 'TRIAL_BALANCE' | 'PROFIT_LOSS' | 'BALANCE_SHEET' | 'CASH_FLOW';
  store_id: number;
  base_fiscal_year_id: number;
  base_start_date: Date;
  base_end_date: Date;
  compare_fiscal_year_id: number;
  compare_start_date: Date;
  compare_end_date: Date;
}

export interface ComparativeLineResult {
  code?: string;
  name: string;
  base_amount: number;
  compare_amount: number;
  absolute_variance: number;
  percentage_variance: number;
}

export interface ComparativeSectionResult {
  name: string;
  type?: string;
  base_total: number;
  compare_total: number;
  absolute_variance: number;
  percentage_variance: number;
  lines: ComparativeLineResult[];
  sub_sections: ComparativeSectionResult[];
}

export interface ComparativeReportResult {
  report_type: string;
  store_id: number;
  base_period: { start: Date; end: Date };
  compare_period: { start: Date; end: Date };
  sections: ComparativeSectionResult[];
  generated_date: Date;
}
