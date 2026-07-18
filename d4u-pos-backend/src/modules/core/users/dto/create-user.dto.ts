import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsInt()
  @IsNotEmpty()
  role_id: number;

  @IsInt()
  @IsOptional()
  store_id?: number;

  @IsInt()
  @IsOptional()
  brand_id?: number;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsObject()
  @IsOptional()
  module_permissions?: Record<string, boolean>;

  @IsOptional()
  rider_details?: any;
}
