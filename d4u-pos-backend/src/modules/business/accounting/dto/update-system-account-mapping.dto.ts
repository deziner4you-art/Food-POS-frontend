import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdateSystemAccountMappingDto {
  @IsNotEmpty()
  @IsInt()
  account_id: number;
}
