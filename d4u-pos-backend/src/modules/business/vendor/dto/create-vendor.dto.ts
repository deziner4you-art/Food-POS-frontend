import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateVendorDto {
  @IsInt()
  @IsNotEmpty()
  store_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
