export interface GeneralLedgerFilter {
  fiscal_year_id: number;
  accounting_period_id?: number;
  start_date: Date;
  end_date: Date;
  account_id?: number;
  account_group_id?: number;
  store_id: number;
  warehouse_id?: number;
  reference_module?: string;
  reference_number?: string;
  journal_number?: string;
  voucher_number?: string;
  user_id?: number;
}
