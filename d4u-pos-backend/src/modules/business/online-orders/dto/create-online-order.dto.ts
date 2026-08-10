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

  // Matches the key the website actually sends (payment_method, not
  // paymentMethod) so this doesn't repeat the customer/customerName class
  // of bug. Customer's stated preference at checkout -- see
  // OnlineOrder.paymentMethod for what this becomes.
  @IsOptional()
  payment_method?: string;

  // Fulfillment choice from website/app checkout: DELIVERY, PICKUP, or
  // DINE_IN (QR-at-table). Stored on OnlineOrder.type, which previously
  // just hardcoded the literal string "Online" and was never read/matched
  // anywhere expecting that value -- see OnlineOrder.type for what this
  // becomes, and KotsService.getActiveKots/getKotsByDay for how the POS
  // Kitchen Display turns it into a Walk-in/Pickup/Online territory label.
  @IsOptional()
  order_type?: string;

  // Logged-in customer's own id, when known -- lets PricingService redeem
  // Loyalty Points and credit earned points against the real customer
  // record instead of only ever resolving one by customerPhone.
  @IsOptional()
  customer_id?: number | string;

  // "Redeem all eligible points" flag -- see PosOrdersService's identical
  // field for why this is a bare boolean, never a client-supplied points
  // number.
  @IsOptional()
  redeem_points?: boolean;
}
