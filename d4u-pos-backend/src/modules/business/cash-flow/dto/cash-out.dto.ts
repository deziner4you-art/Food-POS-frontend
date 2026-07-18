import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CashOutDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
