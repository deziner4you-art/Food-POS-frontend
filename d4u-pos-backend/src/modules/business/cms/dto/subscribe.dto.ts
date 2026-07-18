import { IsInt, IsEmail, IsNotEmpty } from 'class-validator';

export class SubscribeDto {
  @IsInt()
  @IsNotEmpty()
  store_id: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
