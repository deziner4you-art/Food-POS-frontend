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
}
