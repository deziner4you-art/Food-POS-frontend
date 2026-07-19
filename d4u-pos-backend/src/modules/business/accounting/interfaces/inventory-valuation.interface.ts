export interface InventoryValuationContext {
  store_id: number;
  warehouse_id: number;
  product_id: number;
  batch_number?: string;
  movement_type: 'CONSUMPTION' | 'DISPOSAL' | 'TRANSFER' | 'SALE' | 'STOCK_ADJUSTMENT';
  quantity: number;
  transaction_date: Date;
  method: 'FIFO' | 'WEIGHTED_AVERAGE' | 'STANDARD_COST';
}

export interface IValuationStrategy {
  calculateCost(context: InventoryValuationContext): Promise<import('./inventory-cost-result.interface').InventoryCostResult>;
}
