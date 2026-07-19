import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { SystemAccountType } from '../enums/system-account-type.enum';

export class CreateSystemAccountMappingDto {
  @IsNotEmpty()
  @IsEnum(SystemAccountType)
  mapping_type: SystemAccountType;

  @IsNotEmpty()
  @IsInt()
  account_id: number;
}
