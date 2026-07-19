export interface InventoryBalanceResult {
  store_id: number;
  warehouse_id?: number;
  product_id: number;
  batch_number?: string;
  total_in: number;
  total_out: number;
  current_balance: number;
  last_calculated_at: Date;
}
