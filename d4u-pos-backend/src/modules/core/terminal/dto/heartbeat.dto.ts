import { IsNumber, IsNotEmpty } from 'class-validator';

export class HeartbeatDto {
  @IsNumber()
  @IsNotEmpty()
  session_id: number;
}
