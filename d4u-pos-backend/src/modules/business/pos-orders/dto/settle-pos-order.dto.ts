import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SettlePosOrderDto {
  @IsString()
  @IsNotEmpty()
  payment_method: string;

  @IsNumber()
  @IsOptional()
  amount_received?: number;
}
