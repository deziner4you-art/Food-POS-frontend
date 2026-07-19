export interface RecipeIngredientConsumption {
  inventory_id: number;
  consumed_quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface RecipeConsumptionPayload {
  store_id: number;
  kitchen_id?: number;
  product_id: number;
  order_id: number;
  transaction_date: Date;
  created_by: number;
  ingredients: RecipeIngredientConsumption[];
  total_cogs: number;
}
