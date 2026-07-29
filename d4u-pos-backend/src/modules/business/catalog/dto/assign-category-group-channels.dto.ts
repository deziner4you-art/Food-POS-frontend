import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class AssignCategoryGroupChannelsDto {
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
