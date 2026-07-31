import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { KotsService } from './kots.service';
import { UpdateKotStatusDto } from './dto';

@Controller('kots')
export class KotsController {
  constructor(private readonly service: KotsService) {}

  // GET /kots?store_id=1 — KDS اسکرین (active tickets)
  // includeReady=true additionally returns READY tickets from the last 5
  // minutes — opt-in, default omitted (false) preserves the exact prior
  // response for any caller not passing it.
  @RequirePermissions('sales.view')
  @Get()
  getActiveKots(
    @Query('store_id') store_id: string,
    @Query('includeReady') includeReady?: string,
  ) {
    console.log(`[GET] Active KOTs — Store: ${store_id}`);
    return this.service.getActiveKots(Number(store_id), includeReady === 'true');
  }

  // GET /kots/history?store_id=1&business_day_id=5
  @RequirePermissions('sales.view')
  @Get('history')
  getKotsByDay(
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id: string,
  ) {
    return this.service.getKotsByDay(Number(store_id), Number(business_day_id));
  }

  // GET /kots/:id
  @RequirePermissions('sales.view')
  @Get(':id')
  getKot(@Param('id') id: string) {
    return this.service.getKot(Number(id));
  }

  // PATCH /kots/:id/status — Chef نے Accept یا Ready کیا
  @RequirePermissions('sales.update')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateKotStatusDto) {
    console.log(`[KDS] KOT #${id} → ${body.status}`);
    return this.service.updateKotStatus(Number(id), body.status);
  }

  // POST /kots/:id/print — Print button دبایا
  @RequirePermissions('sales.create')
  @Post(':id/print')
  incrementPrint(@Param('id') id: string) {
    return this.service.incrementPrintCount(Number(id));
  }
}
