import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VariantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @IsOptional()
  recipe_id?: number;
}

export class CreateProductDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  category_ids: number[];

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  cost: number;

  @IsNumber()
  @IsNotEmpty()
  margin_pct: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  assigned_store_ids?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  @IsOptional()
  variants?: VariantDto[];

  @IsNumber()
  @IsOptional()
  recipe_id?: number;

  @IsNumber()
  @IsOptional()
  tax_rate?: number;

  @IsString()
  @IsOptional()
  kitchen_station?: string;

  @IsString()
  @IsOptional()
  printer_group?: string;

  @IsString()
  @IsOptional()
  kds_group?: string;

  @IsNumber()
  @IsOptional()
  availability_rule_id?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  modifier_group_ids?: number[];
}
