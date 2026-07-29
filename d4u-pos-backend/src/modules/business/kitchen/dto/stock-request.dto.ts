import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateStockRequestDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsNumber()
  @IsNotEmpty()
  inventory_id: number;

  @IsNumber()
  @IsNotEmpty()
  requested_qty: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @IsOptional()
  kitchen_station_id?: number;

  @IsNumber()
  @IsOptional()
  chef_session_id?: number;

  @IsString()
  @IsOptional()
  requested_by_name?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ResolveStockRequestDto {
  @IsString()
  @IsNotEmpty()
  status: 'APPROVED' | 'FULFILLED' | 'REJECTED';

  @IsNumber()
  @IsNotEmpty()
  approved_by: number;

  @IsNumber()
  @IsOptional()
  fulfilled_qty?: number;
}
