import { StatementSectionResult } from './financial-statement.interface';

export interface BalanceSheetResult {
  store_id: number;
  statement_id: number;
  statement_name: string;
  date: Date;
  
  asset_sections: StatementSectionResult[];
  total_assets: number;
  
  liability_sections: StatementSectionResult[];
  total_liabilities: number;
  
  equity_sections: StatementSectionResult[];
  total_equity_mapped: number;
  
  current_year_profit: number;
  total_equity: number;
  
  total_liabilities_and_equity: number;
  difference: number;
  
  generated_date: Date;
  generated_by: string;
}
