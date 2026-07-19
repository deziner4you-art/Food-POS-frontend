export interface ILedgerEntry {
  id: number;
  store_id: number;
  journal_entry_id: number;
  account_id: number;
  debit_amount: number;
  credit_amount: number;
  description?: string | null;
  cost_center_id?: number | null;
  profit_center_id?: number | null;
  party_type?: string | null;
  party_id?: number | null;
  created_at: Date;
  updated_at: Date;
}
