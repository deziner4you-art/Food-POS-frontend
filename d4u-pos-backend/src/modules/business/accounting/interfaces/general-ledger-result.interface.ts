import { GeneralLedgerLineResult } from './general-ledger-line.interface';

export interface GeneralLedgerResult {
  store_id: number;
  start_date: Date;
  end_date: Date;
  account_id?: number;
  opening_balance: number;
  lines: GeneralLedgerLineResult[];
  closing_balance: number;
  total_debit: number;
  total_credit: number;
}
