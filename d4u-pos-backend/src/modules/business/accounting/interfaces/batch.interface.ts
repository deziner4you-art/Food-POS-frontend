export interface CreateBatchDto {
  store_id: number;
  warehouse_id?: number;
  product_id: number;
  batch_number: string;
  lot_number?: string;
  manufacturing_date?: Date;
  expiry_date?: Date;
  received_quantity: number;
  unit_cost: number;
  valuation_method?: string;
  created_by: number;
}

export interface RecordBatchMovementDto {
  batch_id: number;
  movement_type: 'GRN' | 'CONSUMPTION' | 'WASTE' | 'TRANSFER';
  reference_module: string;
  reference_id: string;
  quantity_in: number;
  quantity_out: number;
  created_by: number;
}
