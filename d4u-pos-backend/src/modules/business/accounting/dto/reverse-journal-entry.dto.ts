import { IsString, IsNotEmpty } from 'class-validator';

export class ReverseJournalEntryDto {
  @IsNotEmpty()
  @IsString()
  reversal_reason: string;
}
