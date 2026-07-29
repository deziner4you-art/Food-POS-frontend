import { IsArray, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ReorderEntryDto {
  @IsInt()
  id: number;

  @IsInt()
  sort_order: number;
}

export class ReorderCategoryGroupsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderEntryDto)
  items: ReorderEntryDto[];

  @IsInt()
  @IsOptional()
  updated_by?: number;
}
