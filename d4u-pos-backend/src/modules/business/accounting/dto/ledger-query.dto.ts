import { IsOptional, IsInt, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class LedgerQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  account_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  fiscal_year_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  accounting_period_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  journal_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
