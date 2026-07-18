import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { KotsService } from './kots.service';
import { UpdateKotStatusDto } from './dto';

@Controller('kots')
export class KotsController {
  constructor(private readonly service: KotsService) {}

  // GET /kots?store_id=1 — KDS اسکرین (active tickets)
  @Get()
  getActiveKots(@Query('store_id') store_id: string) {
    console.log(`[GET] Active KOTs — Store: ${store_id}`);
    return this.service.getActiveKots(Number(store_id));
  }

  // GET /kots/history?store_id=1&business_day_id=5
  @Get('history')
  getKotsByDay(
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id: string,
  ) {
    return this.service.getKotsByDay(Number(store_id), Number(business_day_id));
  }

  // GET /kots/:id
  @Get(':id')
  getKot(@Param('id') id: string) {
    return this.service.getKot(Number(id));
  }

  // PATCH /kots/:id/status — Chef نے Accept یا Ready کیا
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateKotStatusDto) {
    console.log(`[KDS] KOT #${id} → ${body.status}`);
    return this.service.updateKotStatus(Number(id), body.status);
  }

  // POST /kots/:id/print — Print button دبایا
  @Post(':id/print')
  incrementPrint(@Param('id') id: string) {
    return this.service.incrementPrintCount(Number(id));
  }
}
