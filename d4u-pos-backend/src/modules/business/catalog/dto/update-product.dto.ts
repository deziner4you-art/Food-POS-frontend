import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VariantUpdateDto {
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

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsNumber()
  @IsOptional()
  margin_pct?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

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

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  assigned_store_ids?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  category_ids?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantUpdateDto)
  @IsOptional()
  variants?: VariantUpdateDto[];

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
