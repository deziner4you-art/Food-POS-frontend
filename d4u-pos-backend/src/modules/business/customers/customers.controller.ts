import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
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

  // GET /customers?brand_id=1&search=Ali
  @Get()
  getCustomers(
    @Query('brand_id') brand_id: string,
    @Query('search') search?: string,
  ) {
    return this.service.getCustomers(Number(brand_id), search);
  }

  // GET /customers/phone/:phone — فون سے تلاش
  @Get('phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    console.log(`[CRM] Lookup by phone: ${phone}`);
    return this.service.findByPhone(phone);
  }

  // GET /customers/:id/orders — گاہک کے آرڈرز
  @Get(':id/orders')
  getCustomerOrders(@Param('id') id: string) {
    return this.service.getCustomerOrders(Number(id));
  }

  // GET /customers/:id/wallet — Loyalty Points Balance
  @Get(':id/wallet')
  getWallet(@Param('id') id: string) {
    return this.service.getWalletBalance(Number(id));
  }

  // POST /customers — نیا گاہک
  @Post()
  createCustomer(@Body() body: CreateCustomerDto) {
    console.log(`[CRM] New Customer: ${body.name} — ${body.phone}`);
    return this.service.createCustomer(body);
  }

  // PATCH /customers/:id — گاہک اپڈیٹ
  @Patch(':id')
  updateCustomer(@Param('id') id: string, @Body() body: UpdateCustomerDto) {
    return this.service.updateCustomer(Number(id), body);
  }

  // POST /customers/:id/earn — پوائنٹس کمائیں
  @Post(':id/earn')
  earnPoints(@Param('id') id: string, @Body() body: EarnPointsDto) {
    return this.service.earnPoints(
      Number(id),
      body.order_id,
      body.order_amount,
    );
  }

  // POST /customers/:id/redeem — پوائنٹس استعمال کریں
  @Post(':id/redeem')
  redeemPoints(@Param('id') id: string, @Body() body: RedeemPointsDto) {
    return this.service.redeemPoints(Number(id), body.points);
  }
}
