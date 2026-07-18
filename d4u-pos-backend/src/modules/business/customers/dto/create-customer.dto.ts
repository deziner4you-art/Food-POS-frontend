import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @IsInt()
  @IsNotEmpty()
  brand_id: number;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;
}
