export interface WasteResult {
  session_id: number;
  reference_number: string;
  total_items: number;
  total_waste_value: number;
  status: 'POSTED' | 'FAILED';
  accounting_voucher_id?: number;
  errors?: string[];
}
