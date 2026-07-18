import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateKotStatusDto {
  @IsString()
  @IsNotEmpty()
  status: 'PREPARING' | 'READY' | 'CANCELLED';
}
