import { IsString, IsInt, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsInt()
  account_group_id: number;

  @IsOptional()
  @IsInt()
  currency_id?: number;

  @IsOptional()
  @IsNumber()
  opening_balance?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
