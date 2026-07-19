import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateFiscalYearDto {
  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @IsNotEmpty()
  @IsDateString()
  end_date: string;
}
