export interface RecordMovementDto {
  store_id: number;
  warehouse_id?: number;
  product_id: number;
  batch_number?: string;
  movement_type: 'GOODS_RECEIPT' | 'PURCHASE_RETURN' | 'SALE_CONSUMPTION' | 'RECIPE_CONSUMPTION' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'STOCK_ADJUSTMENT' | 'WASTE' | 'SPOILAGE' | 'PRODUCTION' | 'MANUAL_ENTRY';
  reference_module: string;
  reference_id: string;
  quantity_in: number;
  quantity_out: number;
  unit_cost: number;
  total_cost: number;
  valuation_method?: string;
  created_by: number;
  transaction_date: Date;
}
