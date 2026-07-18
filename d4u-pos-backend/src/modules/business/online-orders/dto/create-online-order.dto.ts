import { IsOptional } from 'class-validator';

export class CreateOnlineOrderDto {
  @IsOptional()
  store_id?: number | string;

  @IsOptional()
  customer?: string;

  @IsOptional()
  customerPhone?: string;

  @IsOptional()
  customerAddress?: string;

  @IsOptional()
  items?: any;

  @IsOptional()
  totalAmount?: number | string;

  @IsOptional()
  source?: string;

  @IsOptional()
  notes?: string;
}
