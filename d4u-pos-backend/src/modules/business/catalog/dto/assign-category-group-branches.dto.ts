import { IsArray, IsInt, IsOptional } from 'class-validator';

export class AssignCategoryGroupBranchesDto {
  @IsArray()
  @IsInt({ each: true })
  store_ids: number[];

  @IsInt()
  @IsOptional()
  updated_by?: number;
}
