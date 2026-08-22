import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Delete,
} from '@nestjs/common';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  EarnPointsDto,
  RedeemPointsDto,
} from './dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  // GET /customers?store_id=2&search=Ali
  // Task #2Q-D1: brand_id is no longer read from the query string -- see
  // CustomersService.getCustomers for why (a client-supplied brand_id was
  // trusted for tenant scoping, letting any caller list/search another
  // brand's entire customer base just by changing a query parameter).
  @RequirePermissions('crm.customers.read')
  @Get()
  getCustomers(
    @CurrentUser() authenticatedUser: any,
    @Query('store_id') store_id?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getCustomers(authenticatedUser, store_id ? Number(store_id) : undefined, search);
  }

  // GET /customers/phone/:phone — فون سے تلاش
  // Task #2M: scoped to the authenticated caller's own brand -- see
  // CustomersService.findByPhone for why (Customer.phone is globally
  // unique, but a caller from a different brand must still never be able
  // to confirm/see a real customer that belongs to someone else's brand).
  @RequirePermissions('crm.customers.read')
  @Get('phone/:phone')
  findByPhone(@CurrentUser() user: any, @Param('phone') phone: string) {
    console.log(`[CRM] Lookup by phone: ${phone}`);
    return this.service.findByPhone(phone, user);
  }

  // GET /customers/:id/orders — گاہک کے آرڈرز
  @RequirePermissions('crm.customers.read')
  @Get(':id/orders')
  getCustomerOrders(@CurrentUser() authenticatedUser: any, @Param('id') id: string) {
    return this.service.getCustomerOrders(Number(id), authenticatedUser);
  }

  // GET /customers/:id/wallet — Loyalty Points Balance
  @RequirePermissions('crm.customers.read')
  @Get(':id/wallet')
  getWallet(@Param('id') id: string) {
    return this.service.getWalletBalance(Number(id));
  }

  // POST /customers — نیا گاہک
  @RequirePermissions('crm.customers.create')
  @Post()
  createCustomer(@Body() body: CreateCustomerDto) {
    console.log(`[CRM] New Customer: ${body.name} — ${body.phone}`);
    return this.service.createCustomer(body);
  }

  // PATCH /customers/:id — گاہک اپڈیٹ
  @RequirePermissions('crm.customers.update')
  @Patch(':id')
  updateCustomer(@Param('id') id: string, @Body() body: UpdateCustomerDto) {
    return this.service.updateCustomer(Number(id), body);
  }

  // POST /customers/:id/earn — پوائنٹس کمائیں
  @RequirePermissions('crm.customers.create')
  @Post(':id/earn')
  earnPoints(@Param('id') id: string, @Body() body: EarnPointsDto) {
    return this.service.earnPoints(
      Number(id),
      body.order_id,
      body.order_amount,
    );
  }

  // POST /customers/:id/redeem — پوائنٹس استعمال کریں
  @RequirePermissions('crm.customers.create')
  @Post(':id/redeem')
  redeemPoints(@Param('id') id: string, @Body() body: RedeemPointsDto) {
    return this.service.redeemPoints(Number(id), body.points);
  }

  // DELETE /customers/:id
  @RequirePermissions('crm.customers.delete')
  @Delete(':id')
  deleteCustomer(@Param('id') id: string) {
    return this.service.deleteCustomer(Number(id));
  }
}
