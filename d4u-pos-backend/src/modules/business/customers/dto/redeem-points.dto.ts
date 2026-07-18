import { IsNumber, IsNotEmpty } from 'class-validator';

export class RedeemPointsDto {
  @IsNumber()
  @IsNotEmpty()
  points: number;
}
