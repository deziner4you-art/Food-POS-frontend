import { IsNumber, IsNotEmpty } from 'class-validator';

export class CalculateDealDto {
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  requested_discount_pct: number;
}
