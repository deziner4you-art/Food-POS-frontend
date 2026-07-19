import { IsString, IsInt, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsInt()
  account_group_id?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
