import { StatementSectionResult } from './financial-statement.interface';

export interface CashFlowResult {
  store_id: number;
  statement_id: number;
  statement_name: string;
  start_date: Date;
  end_date: Date;
  
  operating_activities: StatementSectionResult[];
  net_operating_cash: number;
  
  investing_activities: StatementSectionResult[];
  net_investing_cash: number;
  
  financing_activities: StatementSectionResult[];
  net_financing_cash: number;
  
  opening_cash: number;
  closing_cash: number;
  net_cash_movement: number;
  
  difference: number;
  
  generated_date: Date;
  generated_by: string;
}
