import { IsArray, IsOptional } from 'class-validator';

export class SyncOfflineOrdersDto {
  @IsArray()
  @IsOptional()
  orders?: any[];
}
