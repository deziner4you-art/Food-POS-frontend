import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TerminalLoginDto {
  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsString()
  @IsOptional()
  device_id?: string;

  @IsString()
  @IsOptional()
  device_name?: string;
}
