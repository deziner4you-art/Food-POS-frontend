import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  siteTitle?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  googleMapUrl?: string;

  @IsString()
  @IsOptional()
  facebookUrl?: string;

  @IsString()
  @IsOptional()
  instagramUrl?: string;

  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @IsString()
  @IsOptional()
  twitterUrl?: string;

  @IsString()
  @IsOptional()
  youtubeUrl?: string;

  @IsString()
  @IsOptional()
  aboutText?: string;

  @IsString()
  @IsOptional()
  companyText?: string;

  // Global ValidationPipe runs with transformOptions.enableImplicitConversion
  // false, so a bare @IsNumber() would reject the string a plain HTML number
  // input sends via JSON.stringify -- @Type(() => Number) coerces explicitly.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tax_percentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  delivery_fee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  delivery_radius_km?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_order_free_delivery?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  loyalty_points_per_purchase?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  loyalty_purchase_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  loyalty_point_value?: number;

  @IsBoolean()
  @IsOptional()
  module_auth_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  module_kds_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  module_loyalty_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  module_payments_enabled?: boolean;

  // Raw PIN as typed by the admin — the service hashes it before storing
  // into inventoryUnlockPinHash. Omitted/empty means "leave the existing
  // PIN unchanged," never "clear it" (matches how a password field works).
  @IsString()
  @IsOptional()
  inventoryUnlockPin?: string;
}
