import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateBannerDto {
  @IsOptional()
  brand_id?: any;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsString()
  @IsOptional()
  buttonText?: string;

  @IsOptional()
  isActive?: any;

  @IsOptional()
  displayOrder?: any;

  // Multipart form field, sent once per selected branch (same convention as
  // MarketingCampaign's target_store_ids) -- arrives as a string, an array
  // of strings, or omitted entirely depending on how many were checked.
  @IsOptional()
  target_store_ids?: any;
}
