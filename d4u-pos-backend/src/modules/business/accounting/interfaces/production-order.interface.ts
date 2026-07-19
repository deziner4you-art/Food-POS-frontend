export interface CreateProductionOrderDto {
  production_number: string;
  production_type: 'KITCHEN_PRODUCTION' | 'CENTRAL_KITCHEN' | 'SEMI_FINISHED' | 'FINISHED' | 'REWORK';
  target_product_id: number;
  store_id: number;
  warehouse_id?: number;
  kitchen_id?: number;
  planned_quantity: number;
  remarks?: string;
  created_by: number;
}
