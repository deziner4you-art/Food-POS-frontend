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

  // Category Groups are optional — if omitted, the category is simply
  // ungrouped (no group is ever auto-created to hold it).
  @IsInt()
  @IsOptional()
  category_group_id?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  store_ids?: number[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @IsInt()
  @IsOptional()
  sort_order?: number;

  @IsString()
  @IsOptional()
  image_url?: string;
}
