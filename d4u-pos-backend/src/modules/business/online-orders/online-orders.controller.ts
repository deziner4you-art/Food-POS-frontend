import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RequirePermissions, Public, CurrentUser } from '../../../common/decorators';
import { OnlineOrdersService } from './online-orders.service';
import {
  CreateOnlineOrderDto,
  UpdateOnlineOrderStatusDto,
  PostFeedbackDto,
} from './dto';

@Controller('online-orders')
export class OnlineOrdersController {
  constructor(private readonly service: OnlineOrdersService) {}

  // activeOnly=true additionally returns orders past PENDING (accepted,
  // in kitchen, out for delivery, etc.) up to but excluding SETTLED —
  // opt-in, default omitted (false) preserves the exact prior response
  // for any caller not passing it. See getAllOnlineOrders.
  @RequirePermissions('sales.view')
  @Get()
  getOrders(
    @Query('phone') phone?: string,
    @Query('store_id') store_id?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    if (phone) {
      return this.service.getOrdersByPhone(phone);
    }
    return this.service.getAllOnlineOrders(
      store_id ? Number(store_id) : undefined,
      activeOnly === 'true',
    );
  }

  @RequirePermissions('sales.view')
  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.service.getOrder(Number(id));
  }

  @Public()
  @Get('track/:query')
  trackOrder(@Param('query') query: string) {
    return this.service.trackOrder(query);
  }

  @Public()
  @Post('auth/login')
  async webLogin(@Body() body: { phone: string }) {
    // Basic phone login without password (for prototype)
    const customer = await this.service['prisma'].customer.findUnique({
      where: { phone: body.phone },
    });
    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }
    return { success: true, customer };
  }

  @Public()
  @Post('auth/register')
  async webRegister(@Body() body: { phone: string; name: string; brand_id?: number; store_id?: number }) {
    let customer = await this.service['prisma'].customer.findUnique({
      where: { phone: body.phone },
    });
    if (!customer) {
      // Sprint 28.9: no website surface sends brand/store context to this
      // endpoint today, so it can't reliably scope new customers — hardcoded
      // brand_id: 1 is a known gap here (see multi-tenant audit report),
      // preserved as-is rather than half-fixed without a frontend change to
      // actually supply real context. Accepts either field if a future
      // caller does provide it, resolving store_id -> its brand.
      let brandId = body.brand_id;
      if (!brandId && body.store_id) {
        const store = await this.service['prisma'].store.findUnique({ where: { id: body.store_id }, select: { brand_id: true } });
        brandId = store?.brand_id;
      }
      customer = await this.service['prisma'].customer.create({
        data: {
          brand_id: brandId ?? 1,
          phone: body.phone,
          name: body.name,
        },
      });
    }
    return { success: true, customer };
  }

  @Public()
  @Get('auth/history/:phone')
  async webHistory(@Param('phone') phone: string) {
    const customer = await this.service['prisma'].customer.findUnique({
      where: { phone },
      include: {
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { id: 'desc' },
          take: 50,
        },
      },
    });
    if (!customer) {
      return { success: false, message: 'Not found' };
    }
    const onlineOrders = await this.service['prisma'].onlineOrder.findMany({
      where: { customerPhone: phone },
      orderBy: { id: 'desc' },
      take: 50,
    });
    return { success: true, ...customer, onlineOrders };
  }

  @Public()
  @Post()
  createOrder(@Body() body: CreateOnlineOrderDto) {
    return this.service.createOrder(body);
  }

  @RequirePermissions('sales.update')
  @Patch(':id')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateOnlineOrderStatusDto,
    @CurrentUser() user?: any,
  ) {
    return this.service.updateOrderStatus(Number(id), body, user?.store_id);
  }

  @RequirePermissions('sales.create')
  @Post(':id/feedback')
  postFeedback(@Param('id') id: string, @Body() body: PostFeedbackDto) {
    return this.service.postFeedback(
      Number(id),
      body.rating as any,
      body.comment as any,
    );
  }

  @RequirePermissions('sales.delete')
  @Delete(':id')
  acceptOnlineOrder(@Param('id') id: string) {
    return this.service.acceptOnlineOrder(Number(id));
  }
}
