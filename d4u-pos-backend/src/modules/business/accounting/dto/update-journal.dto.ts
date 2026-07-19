import { IsString, IsInt, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { JournalType } from '../enums/journal-type.enum';

export class UpdateJournalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @IsEnum(JournalType)
  type?: JournalType;

  @IsOptional()
  @IsBoolean()
  allow_manual_entries?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_automatic_entries?: boolean;

  @IsOptional()
  @IsBoolean()
  require_approval?: boolean;

  @IsOptional()
  @IsInt()
  default_currency_id?: number;
}
