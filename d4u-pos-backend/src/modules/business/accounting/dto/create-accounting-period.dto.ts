import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateAccountingPeriodDto {
  @IsNotEmpty()
  @IsInt()
  fiscal_year_id: number;
}
