import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class RecordPurchaseDto {
  @IsInt()
  @IsNotEmpty()
  store_id: number;

  @IsInt()
  @IsNotEmpty()
  inventory_id: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  total_cost: number;
}
