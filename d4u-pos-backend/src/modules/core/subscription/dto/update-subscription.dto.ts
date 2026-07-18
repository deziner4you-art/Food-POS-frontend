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
}
