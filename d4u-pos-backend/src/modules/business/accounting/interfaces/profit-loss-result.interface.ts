import { StatementSectionResult } from './financial-statement.interface';

export interface ProfitLossResult {
  store_id: number;
  statement_id: number;
  statement_name: string;
  start_date: Date;
  end_date: Date;
  
  revenue_sections: StatementSectionResult[];
  total_revenue: number;
  
  cost_of_sales_sections: StatementSectionResult[];
  total_cost_of_sales: number;
  
  gross_profit: number;
  
  operating_expense_sections: StatementSectionResult[];
  total_operating_expenses: number;
  
  operating_income: number;
  
  other_income_sections: StatementSectionResult[];
  total_other_income: number;
  
  other_expense_sections: StatementSectionResult[];
  total_other_expenses: number;
  
  net_profit_before_tax: number;
  tax_expense: number;
  net_profit: number;
  
  generated_date: Date;
  generated_by: string;
}
