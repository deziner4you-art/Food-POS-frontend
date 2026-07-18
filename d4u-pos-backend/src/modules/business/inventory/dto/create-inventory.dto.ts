import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateInventoryDto {
  @IsInt()
  @IsNotEmpty()
  store_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @IsOptional()
  reorder_level?: number;

  @IsNumber()
  @IsOptional()
  unit_price?: number;
}
