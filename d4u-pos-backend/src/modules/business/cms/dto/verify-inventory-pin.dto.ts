import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyInventoryPinDto {
  @IsString()
  @IsNotEmpty()
  pin: string;
}
