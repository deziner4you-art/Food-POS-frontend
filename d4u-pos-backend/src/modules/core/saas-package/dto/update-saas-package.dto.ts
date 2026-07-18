import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class UpdateSaasPackageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  has_pos?: boolean;

  @IsBoolean()
  @IsOptional()
  has_website?: boolean;

  @IsBoolean()
  @IsOptional()
  has_customer_app?: boolean;

  @IsBoolean()
  @IsOptional()
  has_rider_app?: boolean;

  @IsBoolean()
  @IsOptional()
  has_kds?: boolean;

  @IsBoolean()
  @IsOptional()
  has_tv_board?: boolean;

  @IsBoolean()
  @IsOptional()
  has_warehouse?: boolean;

  @IsBoolean()
  @IsOptional()
  has_recipes?: boolean;

  @IsBoolean()
  @IsOptional()
  has_marketing?: boolean;

  @IsBoolean()
  @IsOptional()
  has_loyalty?: boolean;

  @IsBoolean()
  @IsOptional()
  has_accounts?: boolean;

  @IsBoolean()
  @IsOptional()
  has_manager_app?: boolean;
}
