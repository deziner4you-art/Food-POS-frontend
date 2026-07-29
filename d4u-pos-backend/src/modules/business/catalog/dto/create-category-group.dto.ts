import { IsString, IsNotEmpty, IsInt, IsOptional, IsArray, IsBoolean, ValidateNested, IsObject } from 'class-validator';
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

export class CreateCategoryGroupDto {
  // Optional: the admin UI doesn't expose a Menu picker for Category Groups —
  // it sends store_id (the active branch) instead, and the service resolves
  // that branch's brand Menu (find-or-create "Main Menu") automatically.
  @IsInt()
  @IsOptional()
  menu_id?: number;

  @IsInt()
  @IsOptional()
  store_id?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

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

  // Nested shape sent by the admin UI (MenuManager.tsx): { pos, website, waiter, qr, kiosk, delivery, takeaway }
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelVisibilityDto)
  channel_visibility?: ChannelVisibilityDto;

  // Flat equivalents also accepted (API_CONTRACT-documented shape) — channel_visibility wins if both are sent.
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
  created_by?: number;
}
