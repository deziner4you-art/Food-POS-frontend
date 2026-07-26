import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  currency: string;

  @IsNumber()
  monthly_rental: number;

  @IsString()
  billing_cycle: string;

  @IsArray()
  modules: { module_key: string; price: number }[];
}

export class OnboardClientDto {
  @IsBoolean()
  is_existing_brand: boolean;

  @IsOptional()
  @IsNumber()
  existing_brand_id?: number;

  @IsString()
  brand_name: string;

  @IsString()
  store_location: string;

  @IsOptional()
  @IsNumber()
  package_id?: number; // Required for NEW_BRAND

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  vat_percentage?: number;

  @IsOptional()
  @IsBoolean()
  is_chain_store?: boolean;

  @IsOptional()
  @IsString()
  menu_strategy?: string;

  @IsOptional()
  @IsString()
  owner_name?: string;

  @IsOptional()
  @IsString()
  owner_phone?: string;

  @IsOptional()
  @IsString()
  owner_email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  admin_user?: {
    name: string;
    phone: string;
    password?: string;
  };
}
