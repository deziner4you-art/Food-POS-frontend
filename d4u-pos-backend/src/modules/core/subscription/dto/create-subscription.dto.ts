import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  password?: string;
}

export class CreateSubscriptionDto {
  @IsBoolean()
  @IsOptional()
  is_existing_brand?: boolean;

  @IsOptional()
  existing_brand_id?: number | string;

  @IsString()
  @IsOptional()
  brand_name?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsOptional()
  vat_percentage?: number | string;

  @IsArray()
  @IsOptional()
  selected_modules?: string[];

  @IsOptional()
  total_billing_amount?: number | string;

  @ValidateNested()
  @Type(() => AdminUserDto)
  @IsOptional()
  admin_user?: AdminUserDto;

  @IsBoolean()
  @IsOptional()
  is_chain_store?: boolean;

  @IsString()
  @IsOptional()
  menu_strategy?: string;

  @IsString()
  @IsOptional()
  store_location?: string;
}
