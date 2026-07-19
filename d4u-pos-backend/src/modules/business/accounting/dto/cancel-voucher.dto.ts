import { IsString, IsNotEmpty } from 'class-validator';

export class CancelVoucherDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
