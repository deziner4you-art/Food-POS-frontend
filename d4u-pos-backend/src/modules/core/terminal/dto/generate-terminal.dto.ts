import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class GenerateTerminalDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsString()
  @IsNotEmpty()
  waiter_name: string;
}
