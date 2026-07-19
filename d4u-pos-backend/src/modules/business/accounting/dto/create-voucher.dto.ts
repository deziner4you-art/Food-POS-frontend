import { IsInt, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVoucherDto {
  @IsInt()
  @Type(() => Number)
  voucher_type_id: number;

  @IsInt()
  @Type(() => Number)
  fiscal_year_id: number;

  @IsInt()
  @Type(() => Number)
  accounting_period_id: number;

  @IsInt()
  @Type(() => Number)
  journal_id: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  currency_id?: number;

  @IsString()
  voucher_number: string;

  @IsOptional()
  @IsString()
  reference_number?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
