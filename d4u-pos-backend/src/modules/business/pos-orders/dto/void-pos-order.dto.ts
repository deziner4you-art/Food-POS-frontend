import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class VoidPosOrderDto {
  @IsString()
  @IsNotEmpty()
  void_reason: string;

  @IsString()
  @IsNotEmpty()
  manager_pin: string;

  @IsNumber()
  @IsNotEmpty()
  approved_by: number;
}
