import { IsString, IsOptional } from 'class-validator';

export class UpdateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

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

  // Untyped like CreateBannerDto's -- arrives as a real boolean/number over
  // JSON (text-only edits) but as a string over multipart (image replace),
  // coerced in the controller either way.
  @IsOptional()
  isActive?: any;

  @IsOptional()
  displayOrder?: any;

  @IsOptional()
  target_store_ids?: any;
}
