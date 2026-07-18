import { IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateRecipeDto {
  @IsNumber()
  @IsOptional()
  inventory_id?: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}
