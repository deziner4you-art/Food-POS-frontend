import { CurrencyRounding } from '../enums/currency-rounding.enum';

export interface ICurrency {
  id: number;
  code: string;
  symbol: string;
  rounding_method: CurrencyRounding;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
