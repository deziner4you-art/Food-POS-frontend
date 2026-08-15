import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PosOrderItemDto {
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  // Which size the cashier picked (see ProductVariant) -- optional, and
  // easy to silently lose since the global ValidationPipe's whitelist
  // strips any field not declared here, even though PosOrdersService
  // itself already knew what to do with it.
  @IsNumber()
  @IsOptional()
  variant_id?: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  special_inst?: string;
}

export class CreatePosOrderDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsNumber()
  @IsNotEmpty()
  created_by: number;

  @IsNumber()
  @IsOptional()
  customer_id?: number;

  // How many points the cashier chose to redeem, atomic with this order (see
  // PosOrdersService.createOrder). Requires customer_id -- the actual amount
  // credited is re-capped server-side by PricingService against the
  // customer's real balance and the real eligible (non-campaign-discounted
  // subtotal + delivery fee) amount, never trusted as-is from the client.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  redeem_points?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemDto)
  items: PosOrderItemDto[];

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsString()
  @IsOptional()
  order_source?: string;

  @IsString()
  @IsOptional()
  table_no?: string;

  // Set when this order was created from a Waiter Terminal, so the waiter's
  // own "My Orders" tab can filter to exactly this order.
  @IsNumber()
  @IsOptional()
  terminal_session_id?: number;

  @IsBoolean()
  @IsOptional()
  is_offline?: boolean;

  @IsString()
  @IsOptional()
  delivery_address?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  couponCode?: string;

  // MARKETING-003 §9 — Order Details / Promotion Stack Explainer: what the
  // client-side decision engine (POS/Waiter/Website) blocked or overrode
  // during this transaction, persisted for audit.
  @IsNumber()
  @IsOptional()
  manager_override_by?: number;

  @IsBoolean()
  @IsOptional()
  coupon_blocked?: boolean;

  @IsBoolean()
  @IsOptional()
  loyalty_blocked?: boolean;

  @IsArray()
  @IsOptional()
  rejected_promotions?: { type: string; reason: string }[];
}
