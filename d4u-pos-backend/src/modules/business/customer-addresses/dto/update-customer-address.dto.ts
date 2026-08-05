import { IsString, IsInt, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateCustomerAddressDto {
  // Ownership check — must match the address row's own customer_id.
  // The public website endpoints have no real session/auth (same
  // prototype-grade trust model as auth/login), so this is what stops one
  // customer's client from mutating another customer's address by guessing
  // a numeric address id.
  @IsInt()
  @IsNotEmpty()
  customer_id: number;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
