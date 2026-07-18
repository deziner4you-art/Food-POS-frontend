import { IsOptional } from 'class-validator';

export class UpdateOnlineOrderStatusDto {
  @IsOptional()
  orderId?: number | string;

  @IsOptional()
  status?: string;

  @IsOptional()
  kdsStatus?: string;

  @IsOptional()
  type?: string;

  @IsOptional()
  source?: string;

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
  notes?: string;

  @IsOptional()
  prepTimeMinutes?: number | string;

  @IsOptional()
  estimatedReadyAt?: string;

  @IsOptional()
  timePlaced?: string;

  @IsOptional()
  riderAssigned?: boolean;

  @IsOptional()
  feedback?: any;

  @IsOptional()
  delivery?: any;
}
