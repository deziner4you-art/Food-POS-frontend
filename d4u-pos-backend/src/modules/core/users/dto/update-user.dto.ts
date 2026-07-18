import { IsString, IsInt, IsOptional, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  pin?: string;

  @IsInt()
  @IsOptional()
  role_id?: number;

  @IsInt()
  @IsOptional()
  store_id?: number;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsObject()
  @IsOptional()
  module_permissions?: Record<string, boolean>;

  @IsOptional()
  rider_details?: any;
}
