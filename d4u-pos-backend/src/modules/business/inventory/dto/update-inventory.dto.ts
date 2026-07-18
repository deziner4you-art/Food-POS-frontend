import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateInventoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  reorder_level?: number;

  @IsNumber()
  @IsOptional()
  unit_price?: number;
}
