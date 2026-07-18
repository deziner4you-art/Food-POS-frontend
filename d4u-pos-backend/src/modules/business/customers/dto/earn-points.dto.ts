import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class EarnPointsDto {
  @IsInt()
  @IsNotEmpty()
  order_id: number;

  @IsNumber()
  @IsNotEmpty()
  order_amount: number;
}
