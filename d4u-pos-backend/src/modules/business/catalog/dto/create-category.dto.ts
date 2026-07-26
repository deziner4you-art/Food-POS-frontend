import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateCategoryDto {
  @IsInt()
  @IsNotEmpty()
  store_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsOptional()
  menu_id?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  store_ids?: number[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  sort_order?: number;

  @IsString()
  @IsOptional()
  image_url?: string;
}
