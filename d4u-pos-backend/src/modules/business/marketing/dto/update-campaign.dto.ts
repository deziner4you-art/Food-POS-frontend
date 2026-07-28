import { IsString, IsOptional } from 'class-validator';

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  title?: string;

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
  end_date?: any;

  @IsOptional()
  campaign_type?: any;

  @IsOptional()
  flat_discount_amount?: any;

  @IsOptional()
  buy_product_id?: any;

  @IsOptional()
  buy_qty?: any;

  @IsOptional()
  get_product_id?: any;

  @IsOptional()
  reward_type?: any;

  @IsOptional()
  reward_qty?: any;

  @IsOptional()
  priority?: any;

  @IsOptional()
  allow_stacking?: any;

  @IsOptional()
  published_qr?: any;

  @IsOptional()
  published_kiosk?: any;

  @IsOptional()
  bundle_price?: any;

  @IsOptional()
  bundle_product_ids?: any;

  @IsOptional()
  min_spend?: any;

  @IsOptional()
  gift_product_id?: any;

  @IsOptional()
  active_days?: any;

  @IsOptional()
  active_time_start?: any;

  @IsOptional()
  active_time_end?: any;

  @IsOptional()
  active_dates?: any;

  @IsOptional()
  show_countdown?: any;

  @IsOptional()
  target_store_ids?: any;

  @IsOptional()
  target_category_ids?: any;

  @IsOptional()
  target_product_ids?: any;
}
