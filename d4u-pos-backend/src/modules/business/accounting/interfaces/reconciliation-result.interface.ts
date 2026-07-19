export interface ReconciliationResult {
  session_id: number;
  total_items_counted: number;
  total_variance_value: number;
  gain_value: number;
  loss_value: number;
  status: 'RECONCILED' | 'FAILED';
  accounting_voucher_id?: number;
  errors?: string[];
}
