export interface CreateTransferRequestDto {
  transfer_number: string;
  source_store_id: number;
  source_warehouse_id?: number;
  dest_store_id: number;
  dest_warehouse_id?: number;
  remarks?: string;
  created_by: number;
}

export interface AddTransferLineDto {
  product_id: number;
  batch_id?: number;
  requested_quantity: number;
  remarks?: string;
}
