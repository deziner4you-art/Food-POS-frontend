import { IsString, IsOptional } from 'class-validator';

export class UpdateScheduledDiscountDto {
  @IsOptional()
  brand_id?: any;

  @IsString()
  @IsOptional()
  title?: string;

  @IsOptional()
  discount_pct?: any;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsOptional()
  target_category_id?: any;

  @IsOptional()
  target_product_id?: any;

  @IsOptional()
  start_date?: any;

  @IsOptional()
  end_date?: any;

  @IsOptional()
  target_stores?: any;
}
