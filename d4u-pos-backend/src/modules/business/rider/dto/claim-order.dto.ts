import { IsNotEmpty, IsOptional } from 'class-validator';

export class ClaimOrderDto {
  @IsNotEmpty()
  riderId: number | string;

  @IsOptional()
  riderName?: string;
}
