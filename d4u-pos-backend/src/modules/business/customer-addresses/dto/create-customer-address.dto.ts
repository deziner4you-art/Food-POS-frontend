import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateCustomerAddressDto {
  @IsInt()
  @IsNotEmpty()
  customer_id: number;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
