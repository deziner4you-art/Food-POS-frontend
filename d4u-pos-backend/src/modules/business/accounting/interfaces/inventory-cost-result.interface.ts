export interface CostLayer {
  batch_number?: string;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
}

export interface InventoryCostResult {
  unit_cost: number;
  total_cost: number;
  valuation_method: 'FIFO' | 'WEIGHTED_AVERAGE' | 'STANDARD_COST';
  cost_layers: CostLayer[];
}
