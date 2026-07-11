import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { BusinessDayService } from './business-day.service';

@Controller('business-day')
export class BusinessDayController {
  constructor(private readonly service: BusinessDayService) {}

  // GET /business-day/current?store_id=1 — آج کا Open Day
  @Get('current')
  getCurrentDay(@Query('store_id') store_id: string) {
    if (!store_id) return { error: 'store_id is required' };
    console.log(`[GET] Current Business Day — Store: ${store_id}`);
    return this.service.getCurrentDay(Number(store_id));
  }

  // GET /business-day/history?store_id=1 — پچھلے دنوں کی تاریخ
  @Get('history')
  getDayHistory(@Query('store_id') store_id: string, @Query('limit') limit?: string) {
    return this.service.getDayHistory(Number(store_id), limit ? Number(limit) : 30);
  }

  // POST /business-day/start — Day Start بٹن
  @Post('start')
  startDay(
    @Body()
    body: { store_id: number; started_by: number; openingFloat: number },
  ) {
    console.log(`[DAY START] Store: ${body.store_id} — Opening Float: Rs.${body.openingFloat}`);
    return this.service.startDay(body.store_id, body.started_by, body.openingFloat);
  }

  // POST /business-day/close — Day Close بٹن
  @Post('close')
  closeDay(
    @Body()
    body: { store_id: number; closed_by: number; closingCash: number; notes?: string },
  ) {
    console.log(`[DAY CLOSE] Store: ${body.store_id} — Closing Cash: Rs.${body.closingCash}`);
    return this.service.closeDay(body.store_id, body.closed_by, body.closingCash, body.notes);
  }
}
