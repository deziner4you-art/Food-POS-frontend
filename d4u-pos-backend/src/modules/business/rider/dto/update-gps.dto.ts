import { IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateGpsDto {
  @IsNotEmpty()
  orderId: number | string;

  @IsNotEmpty()
  lat: number | string;

  @IsNotEmpty()
  lng: number | string;

  @IsOptional()
  riderId?: string;
}
