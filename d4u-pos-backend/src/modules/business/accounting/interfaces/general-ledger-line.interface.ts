export interface GeneralLedgerLineResult {
  posting_date: Date;
  account_code: string;
  account_name: string;
  journal_number: string;
  voucher_number: string;
  reference_module: string;
  reference_number: string;
  description: string;
  debit: number;
  credit: number;
  running_balance: number;
  posted_by: string;
  created_at: Date;
}
