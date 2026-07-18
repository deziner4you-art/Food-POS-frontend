import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CalculateSlaDto {
  @IsString()
  @IsNotEmpty()
  agency: string;

  @IsNumber()
  @IsNotEmpty()
  target: number;

  @IsNumber()
  @IsNotEmpty()
  achieved: number;

  @IsNumber()
  @IsNotEmpty()
  retainer: number;
}
