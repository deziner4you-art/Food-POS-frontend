import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { PosOrdersService } from './pos-orders.service';

@Controller('pos-orders')
export class PosOrdersController {
  constructor(private readonly service: PosOrdersService) {}

  // GET /pos-orders?store_id=1&business_day_id=2
  @Get()
  getOrders(
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id?: string,
  ) {
    console.log(`[GET] POS Orders — Store: ${store_id}`);
    return this.service.getOrders(Number(store_id), business_day_id ? Number(business_day_id) : undefined);
  }

  // GET /pos-orders/summary?store_id=1
  @Get('summary')
  getSummary(
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id?: string,
  ) {
    console.log(`[GET] Sales Summary — Store: ${store_id}`);
    return this.service.getSalesSummary(Number(store_id), business_day_id ? Number(business_day_id) : undefined);
  }

  // GET /pos-orders/:id
  @Get(':id')
  getOrder(@Param('id') id: string) {
    console.log(`[GET] Order #${id}`);
    return this.service.getOrder(Number(id));
  }

  // POST /pos-orders — نیا آرڈر
  @Post()
  createOrder(@Body() body: any) {
    console.log(`[POST] New POS Order — Store: ${body.store_id} | Items: ${body.items?.length}`);
    return this.service.createOrder(body);
  }

  // PATCH /pos-orders/:id/void — آرڈر کینسل (مینیجر PIN درکار)
  @Patch(':id/void')
  voidOrder(@Param('id') id: string, @Body() body: any) {
    console.log(`[VOID] Order #${id} — Reason: ${body.void_reason}`);
    return this.service.voidOrder(Number(id), body);
  }

  // PATCH /pos-orders/:id/settle — پیمنٹ وصول
  @Patch(':id/settle')
  settleOrder(@Param('id') id: string, @Body() body: any) {
    console.log(`[SETTLE] Order #${id} — Method: ${body.payment_method}`);
    return this.service.settleOrder(Number(id), body);
  }

  // POST /pos-orders/sync-offline — Sync locally stored Dexie KOTs
  @Post('sync-offline')
  syncOffline(@Body() body: { orders: any[] }) {
    console.log(`[SYNC-OFFLINE] Received ${body.orders?.length} offline orders`);
    return this.service.syncOfflineOrders(body.orders || []);
  }
}
