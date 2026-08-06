import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { validateTenantAccess } from '../../../common/utils/tenant.util';
import { PosOrdersService } from './pos-orders.service';
import {
  CreatePosOrderDto,
  VoidPosOrderDto,
  SettlePosOrderDto,
  SyncOfflineOrdersDto,
} from './dto';

@Controller('pos-orders')
export class PosOrdersController {
  constructor(private readonly service: PosOrdersService) {}

  // GET /pos-orders?store_id=1&business_day_id=2
  @RequirePermissions('sales.view')
  @Get()
  getOrders(
    @CurrentUser() user: any,
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id?: string,
    @Query('terminal_session_id') terminal_session_id?: string,
  ) {
    validateTenantAccess(user, Number(store_id));
    console.log(`[GET] POS Orders — Store: ${store_id}`);
    return this.service.getOrders(
      Number(store_id),
      business_day_id ? Number(business_day_id) : undefined,
      terminal_session_id ? Number(terminal_session_id) : undefined,
    );
  }

  // GET /pos-orders/summary?store_id=1
  @RequirePermissions('sales.view')
  @Get('summary')
  getSummary(
    @CurrentUser() user: any,
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id?: string,
  ) {
    validateTenantAccess(user, Number(store_id));
    console.log(`[GET] Sales Summary — Store: ${store_id}`);
    return this.service.getSalesSummary(
      Number(store_id),
      business_day_id ? Number(business_day_id) : undefined,
    );
  }

  // GET /pos-orders/:id
  @RequirePermissions('sales.view')
  @Get(':id')
  async getOrder(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    console.log(`[GET] Order #${id}`);
    const order = await this.service.getOrder(Number(id));
    if (order) validateTenantAccess(user, order.store_id);
    return order;
  }

  // POST /pos-orders — نیا آرڈر
  @RequirePermissions('sales.create')
  @Post()
  createOrder(
    @CurrentUser() user: any,
    @Body() body: CreatePosOrderDto
  ) {
    validateTenantAccess(user, body.store_id);
    console.log(
      `[POST] New POS Order — Store: ${body.store_id} | Items: ${body.items?.length}`,
    );
    return this.service.createOrder(body);
  }

  // PATCH /pos-orders/:id/void — آرڈر کینسل (مینیجر PIN درکار)
  @RequirePermissions('sales.update')
  @Patch(':id/void')
  async voidOrder(
    @CurrentUser() user: any,
    @Param('id') id: string, 
    @Body() body: VoidPosOrderDto
  ) {
    console.log(`[VOID] Order #${id} — Reason: ${body.void_reason}`);
    const order = await this.service.getOrder(Number(id));
    if (order) validateTenantAccess(user, order.store_id);
    return this.service.voidOrder(Number(id), body);
  }

  // PATCH /pos-orders/:id/settle — پیمنٹ وصول
  @RequirePermissions('sales.update')
  @Patch(':id/settle')
  async settleOrder(
    @CurrentUser() user: any,
    @Param('id') id: string, 
    @Body() body: SettlePosOrderDto
  ) {
    console.log(`[SETTLE] Order #${id} — Method: ${body.payment_method}`);
    const order = await this.service.getOrder(Number(id));
    if (order) validateTenantAccess(user, order.store_id);
    return this.service.settleOrder(Number(id), body);
  }

  // PATCH /pos-orders/:id/status — delivery lifecycle progression for
  // POS-native delivery orders (Rider Arrived / Print Bill / Dispatch /
  // Settle Cash) — see PosOrdersService.updateDeliveryStatus.
  @RequirePermissions('sales.update')
  @Patch(':id/status')
  async updateDeliveryStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const order = await this.service.getOrder(Number(id));
    if (order) validateTenantAccess(user, order.store_id);
    return this.service.updateDeliveryStatus(Number(id), body.status);
  }

  // POST /pos-orders/sync-offline — Sync locally stored Dexie KOTs
  @RequirePermissions('sales.create')
  @Post('sync-offline')
  syncOffline(
    @CurrentUser() user: any,
    @Body() body: SyncOfflineOrdersDto
  ) {
    console.log(
      `[SYNC-OFFLINE] Received ${body.orders?.length} offline orders`,
    );
    // Offline orders payload needs validation per order
    if (body.orders && body.orders.length > 0) {
      validateTenantAccess(user, body.orders[0].store_id);
    }
    return this.service.syncOfflineOrders(body.orders || []);
  }
}
