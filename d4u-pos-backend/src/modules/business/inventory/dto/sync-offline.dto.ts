import { IsInt, IsNotEmpty, IsArray } from 'class-validator';

export class SyncOfflineDto {
  @IsInt()
  @IsNotEmpty()
  store_id: number;

  @IsArray()
  @IsNotEmpty()
  transactions: any[];
}
