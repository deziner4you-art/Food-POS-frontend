import { IsString, IsInt, IsOptional, IsArray } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  menu_id?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  store_ids?: number[];
}
