export interface FinancialStatementResult {
  statement_id: number;
  store_id: number;
  name: string;
  type: string;
  start_date: Date;
  end_date: Date;
  sections: StatementSectionResult[];
}

export interface StatementSectionResult {
  section_id: number;
  name: string;
  type: string;
  sort_order: number;
  total_amount: number;
  sub_sections: StatementSectionResult[];
  lines: StatementLineResult[];
}

export interface StatementLineResult {
  account_id?: number;
  account_group_id?: number;
  code: string;
  name: string;
  amount: number;
}
