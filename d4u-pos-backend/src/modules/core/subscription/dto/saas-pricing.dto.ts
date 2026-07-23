import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateSaaSPricingDto {
  @IsString()
  module_key: string;

  @IsString()
  module_name: string;

  @IsNumber()
  price_monthly: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class UpdateSaaSPricingDto {
  @IsString()
  @IsOptional()
  module_name?: string;

  @IsNumber()
  @IsOptional()
  price_monthly?: number;
}
