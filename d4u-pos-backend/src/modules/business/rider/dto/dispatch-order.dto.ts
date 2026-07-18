import { IsOptional, IsNotEmpty } from 'class-validator';

export class DispatchOrderDto {
  @IsNotEmpty()
  bridgeOrderId: number | string;

  @IsOptional()
  order?: any;
}
