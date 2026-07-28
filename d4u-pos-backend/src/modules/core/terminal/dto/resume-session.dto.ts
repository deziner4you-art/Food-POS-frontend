import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class ResumeSessionDto {
  @IsNumber()
  @IsNotEmpty()
  session_id: number;

  @IsString()
  @IsNotEmpty()
  device_id: string;
}
