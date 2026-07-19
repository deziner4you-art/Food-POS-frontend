import { JournalStatus } from '../enums/journal-status.enum';
import { ILedgerEntry } from './ledger-entry.interface';

export interface IJournalEntry {
  id: number;
  store_id: number;
  journal_id: number;
  fiscal_year_id: number;
  accounting_period_id: number;
  posting_date: Date;
  reference_type?: string | null;
  reference_id?: number | string | null;
  description?: string | null;
  total_amount: number;
  status: JournalStatus;
  lines?: ILedgerEntry[];
  created_by?: number | null;
  created_at: Date;
  updated_at: Date;
}
