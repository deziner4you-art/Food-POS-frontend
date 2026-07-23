import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  brand_id?: number | string;

  @IsString()
  @IsOptional()
  plan_name?: string;

  @IsOptional()
  modules?: any;

  @IsBoolean()
  @IsOptional()
  is_chain_store?: boolean;

  @IsString()
  @IsOptional()
  menu_strategy?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsOptional()
  vat_percentage?: number | string;

  // New Branch Details
  @IsOptional() @IsString() owner_name?: string;
  @IsOptional() @IsString() owner_phone?: string;
  @IsOptional() @IsString() owner_email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() map_pin?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() landline?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() order_no_prefix?: string;
}
