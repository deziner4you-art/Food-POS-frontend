import { IsString, IsOptional, IsBoolean } from 'class-validator';

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
}
