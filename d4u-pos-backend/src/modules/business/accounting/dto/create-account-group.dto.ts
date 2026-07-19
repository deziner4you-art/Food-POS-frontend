import { IsString, IsInt, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { AccountType } from '../enums/account-type.enum';

export class CreateAccountGroupDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsEnum(AccountType)
  root_type: AccountType;

  @IsOptional()
  @IsInt()
  parent_group_id?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
