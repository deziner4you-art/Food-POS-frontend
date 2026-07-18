import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class POItemDto {
  @IsInt()
  @IsNotEmpty()
  inventory_id: number;

  @IsNumber()
  @IsNotEmpty()
  ordered_qty: number;

  @IsNumber()
  @IsNotEmpty()
  price_unit: number;
}

export class CreatePODto {
  @IsInt()
  @IsNotEmpty()
  store_id: number;

  @IsInt()
  @IsNotEmpty()
  vendor_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POItemDto)
  @IsNotEmpty()
  items: POItemDto[];
}
