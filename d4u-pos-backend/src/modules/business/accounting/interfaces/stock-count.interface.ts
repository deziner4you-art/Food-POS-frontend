export interface CreateStockCountDto {
  store_id: number;
  warehouse_id?: number;
  scheduled_date: Date;
  remarks?: string;
  created_by: number;
}

export interface RecordPhysicalCountDto {
  product_id: number;
  physical_quantity: number;
  remarks?: string;
}
