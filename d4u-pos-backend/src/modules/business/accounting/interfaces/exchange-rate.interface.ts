export interface IExchangeRate {
  id: number;
  store_id: number;
  base_currency_id: number;
  target_currency_id: number;
  rate: number;
  effective_date: Date;
  created_at: Date;
  updated_at: Date;
}
