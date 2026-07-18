import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  discount_pct?: any;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsOptional()
  published_pos?: any;

  @IsOptional()
  published_web?: any;

  @IsOptional()
  published_tv?: any;

  @IsOptional()
  published_facebook?: any;

  @IsOptional()
  published_instagram?: any;

  @IsOptional()
  schedule_for_later?: any;

  @IsOptional()
  scheduled_at?: any;

  @IsOptional()
  target_store_ids?: any;

  @IsOptional()
  target_category_ids?: any;

  @IsOptional()
  target_product_ids?: any;
}
