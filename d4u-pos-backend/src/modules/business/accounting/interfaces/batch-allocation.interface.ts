export interface AllocateBatchRequest {
  store_id: number;
  warehouse_id?: number;
  product_id: number;
  quantity_required: number;
  strategy: 'FIFO' | 'FEFO' | 'MANUAL';
  manual_batch_number?: string;
}

export interface AllocationResult {
  batch_id: number;
  batch_number: string;
  allocated_quantity: number;
  unit_cost: number;
}
