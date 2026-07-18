import { IsString, IsNotEmpty } from 'class-validator';

export class TerminalLoginDto {
  @IsString()
  @IsNotEmpty()
  pin: string;
}
