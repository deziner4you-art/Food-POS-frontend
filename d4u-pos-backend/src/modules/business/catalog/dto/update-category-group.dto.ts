import { IsString, IsInt, IsOptional, IsArray, IsBoolean, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class ChannelVisibilityDto {
  @IsBoolean() @IsOptional() pos?: boolean;
  @IsBoolean() @IsOptional() website?: boolean;
  @IsBoolean() @IsOptional() waiter?: boolean;
  @IsBoolean() @IsOptional() qr?: boolean;
  @IsBoolean() @IsOptional() kiosk?: boolean;
  @IsBoolean() @IsOptional() delivery?: boolean;
  @IsBoolean() @IsOptional() takeaway?: boolean;
}

export class UpdateCategoryGroupDto {
  @IsInt()
  @IsOptional()
  menu_id?: number;

  @IsInt()
  @IsOptional()
  store_id?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  store_ids?: number[];

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelVisibilityDto)
  channel_visibility?: ChannelVisibilityDto;

  @IsBoolean()
  @IsOptional()
  visible_pos?: boolean;

  @IsBoolean()
  @IsOptional()
  visible_website?: boolean;

  @IsBoolean()
  @IsOptional()
  visible_waiter?: boolean;

  @IsBoolean()
  @IsOptional()
  visible_qr_menu?: boolean;

  @IsBoolean()
  @IsOptional()
  visible_kiosk?: boolean;

  @IsBoolean()
  @IsOptional()
  visible_delivery?: boolean;

  @IsBoolean()
  @IsOptional()
  visible_takeaway?: boolean;

  @IsInt()
  @IsOptional()
  updated_by?: number;
}
