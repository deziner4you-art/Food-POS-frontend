export interface CreateFixedAssetInput {
  store_id: number;
  category_id: number;
  location_id?: number;
  code: string;
  name: string;
  description?: string;
  purchase_date: Date;
  purchase_cost: number;
  capitalization_date?: Date;
  residual_value: number;
  useful_life: number;
  department?: string;
}

export interface UpdateFixedAssetInput {
  name?: string;
  description?: string;
  status?: string;
  department?: string;
  capitalization_date?: Date;
}
