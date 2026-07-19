import { IsInt, IsNotEmpty } from 'class-validator';

export class MoveAccountDto {
  @IsNotEmpty()
  @IsInt()
  new_parent_id: number; // account_group_id for Account, parent_group_id for AccountGroup
}
