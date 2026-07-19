import { IsString, IsInt, IsOptional, IsArray, ValidateNested, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class JournalEntryLineDto {
  @IsInt()
  account_id: number;

  @IsNumber()
  @Min(0)
  debit_amount: number;

  @IsNumber()
  @Min(0)
  credit_amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  cost_center_id?: number;

  @IsOptional()
  @IsInt()
  profit_center_id?: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class CreateJournalEntryDto {
  @IsInt()
  journal_id: number;

  @IsInt()
  fiscal_year_id: number;

  @IsInt()
  accounting_period_id: number;

  @IsDateString()
  posting_date: string;

  @IsString()
  reference_number: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  currency_id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}
