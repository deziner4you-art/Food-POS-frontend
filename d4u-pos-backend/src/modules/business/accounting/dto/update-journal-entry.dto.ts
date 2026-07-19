import { IsString, IsInt, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { JournalEntryLineDto } from './create-journal-entry.dto';

export class UpdateJournalEntryDto {
  @IsOptional()
  @IsInt()
  journal_id?: number;

  @IsOptional()
  @IsInt()
  fiscal_year_id?: number;

  @IsOptional()
  @IsInt()
  accounting_period_id?: number;

  @IsOptional()
  @IsDateString()
  posting_date?: string;

  @IsOptional()
  @IsString()
  reference_number?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  currency_id?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines?: JournalEntryLineDto[];
}
