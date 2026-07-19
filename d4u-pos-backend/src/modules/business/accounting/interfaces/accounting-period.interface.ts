import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

export interface IAccountingPeriod {
  id: number;
  store_id: number;
  fiscal_year_id: number;
  month: number;
  year: number;
  start_date: Date;
  end_date: Date;
  status: AccountingPeriodStatus;
  created_at: Date;
  updated_at: Date;
}
