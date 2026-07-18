import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CloseBusinessDayDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsNumber()
  @IsNotEmpty()
  closed_by: number;

  @IsNumber()
  @IsNotEmpty()
  closingCash: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
