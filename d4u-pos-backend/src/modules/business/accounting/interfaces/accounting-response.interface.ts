export interface AccountingResponse {
  success: boolean;
  voucher_id?: number;
  journal_entry_id?: number;
  posting_status: string;
  ledger_status: string;
  reference_number: string;
  errors?: string[];
  warnings?: string[];
}
