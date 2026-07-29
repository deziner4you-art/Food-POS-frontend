import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateInventoryLockDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsNumber()
  @IsNotEmpty()
  inventory_id: number;

  @IsNumber()
  @IsOptional()
  kot_id?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsNumber()
  @IsOptional()
  locked_by?: number;
}

// Mirrors VoidPosOrderDto's manager-PIN pattern (pos-orders/dto/void-pos-order.dto.ts):
// the front-end names WHICH manager is authorizing, then the PIN is re-verified server-side.
export class UnlockInventoryDto {
  @IsString()
  @IsNotEmpty()
  manager_pin: string;

  @IsNumber()
  @IsNotEmpty()
  approved_by: number;
}
