import { IsString, IsInt, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { JournalType } from '../enums/journal-type.enum';

export class CreateJournalDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  prefix: string;

  @IsEnum(JournalType)
  type: JournalType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

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
  @IsBoolean()
  is_system_generated?: boolean;

  @IsOptional()
  @IsInt()
  default_currency_id?: number;
}
