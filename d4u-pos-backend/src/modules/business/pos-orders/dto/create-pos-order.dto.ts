import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PosOrderItemDto {
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  special_inst?: string;
}

export class CreatePosOrderDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsNumber()
  @IsNotEmpty()
  created_by: number;

  @IsNumber()
  @IsOptional()
  customer_id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemDto)
  items: PosOrderItemDto[];

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsString()
  @IsOptional()
  order_source?: string;

  @IsString()
  @IsOptional()
  table_no?: string;

  @IsBoolean()
  @IsOptional()
  is_offline?: boolean;

  @IsString()
  @IsOptional()
  delivery_address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
