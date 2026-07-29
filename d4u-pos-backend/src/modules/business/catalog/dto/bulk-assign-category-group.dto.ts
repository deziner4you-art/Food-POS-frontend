import { IsArray, IsInt, IsOptional, ArrayNotEmpty } from 'class-validator';

export class BulkAssignCategoryGroupDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  category_ids: number[];

  // Category Groups are optional (Hotfix: Remove Runtime Migration Default
  // Groups) — null is a valid, deliberate value here: bulk-unassign the
  // given categories back to ungrouped.
  @IsInt()
  @IsOptional()
  category_group_id?: number | null;

  @IsInt()
  @IsOptional()
  updated_by?: number;
}
