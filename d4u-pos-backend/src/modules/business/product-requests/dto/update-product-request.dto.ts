import { IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateProductRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  category_id?: number;

  @IsNumber()
  @IsOptional()
  suggested_price?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  recipe_notes?: string;

  @IsNumber()
  @IsOptional()
  recipe_id?: number;

  @IsString()
  @IsOptional()
  kitchen_station?: string;
}
