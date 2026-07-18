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
}
