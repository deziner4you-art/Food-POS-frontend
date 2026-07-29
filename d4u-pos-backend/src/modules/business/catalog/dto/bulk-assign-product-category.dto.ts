import { IsArray, IsInt, IsOptional, IsNotEmpty, ArrayNotEmpty } from 'class-validator';

export class BulkAssignProductCategoryDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  product_ids: number[];

  @IsInt()
  @IsNotEmpty()
  category_id: number;

  @IsInt()
  @IsOptional()
  updated_by?: number;
}
