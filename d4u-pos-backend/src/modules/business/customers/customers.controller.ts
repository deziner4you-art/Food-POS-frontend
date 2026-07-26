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
import { RequirePermissions } from '../../../common/decorators';
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

  // GET /customers?brand_id=1&store_id=2&search=Ali
  @RequirePermissions('crm.customers.read')
  @Get()
  getCustomers(
    @Query('brand_id') brand_id: string,
    @Query('store_id') store_id?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getCustomers(Number(brand_id), store_id ? Number(store_id) : undefined, search);
  }

  // GET /customers/phone/:phone — فون سے تلاش
  @RequirePermissions('crm.customers.read')
  @Get('phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    console.log(`[CRM] Lookup by phone: ${phone}`);
    return this.service.findByPhone(phone);
  }

  // GET /customers/:id/orders — گاہک کے آرڈرز
  @RequirePermissions('crm.customers.read')
  @Get(':id/orders')
  getCustomerOrders(@Param('id') id: string) {
    return this.service.getCustomerOrders(Number(id));
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
  @RequirePermissions('crm.delete')
  @Delete(':id')
  deleteCustomer(@Param('id') id: string) {
    return this.service.deleteCustomer(Number(id));
  }
}
