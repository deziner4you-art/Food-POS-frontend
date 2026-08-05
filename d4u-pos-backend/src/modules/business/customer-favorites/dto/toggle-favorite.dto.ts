import { IsInt, IsNotEmpty } from 'class-validator';

export class ToggleFavoriteDto {
  @IsInt()
  @IsNotEmpty()
  customer_id: number;

  @IsInt()
  @IsNotEmpty()
  product_id: number;
}
