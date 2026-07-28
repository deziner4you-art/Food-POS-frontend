import { IsNumber, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateProductRequestDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsNumber()
  @IsNotEmpty()
  requested_by: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  category_id?: number;

  @IsNumber()
  @IsNotEmpty()
  suggested_price: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  recipe_notes?: string;

  @IsNumber()
  @IsOptional()
  recipe_id?: number;

  @IsString()
  @IsOptional()
  kitchen_station?: string;

  // When true, the request is created and immediately submitted in one step —
  // used by the POS cashier flow, which has no separate Draft step in the UI.
  @IsOptional()
  submit?: boolean;
}
