import { IsNumber, IsNotEmpty } from 'class-validator';

export class OpenBusinessDayDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsNumber()
  @IsNotEmpty()
  started_by: number;

  @IsNumber()
  @IsNotEmpty()
  openingFloat: number;
}
