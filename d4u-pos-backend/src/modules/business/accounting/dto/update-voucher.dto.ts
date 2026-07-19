import { IsInt, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVoucherDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  voucher_type_id?: number;

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
  @IsInt()
  @Type(() => Number)
  currency_id?: number;

  @IsOptional()
  @IsString()
  voucher_number?: string;

  @IsOptional()
  @IsString()
  reference_number?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
