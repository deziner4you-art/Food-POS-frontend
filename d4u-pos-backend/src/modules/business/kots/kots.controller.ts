import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { KotsService } from './kots.service';

@Controller('kots')
export class KotsController {
  constructor(private readonly service: KotsService) {}

  // GET /kots?store_id=1 — KDS اسکرین (active tickets)
  // includeReady=true additionally returns READY tickets from the last 5
  // minutes — opt-in, default omitted (false) preserves the exact prior
  // response for any caller not passing it.
  @RequirePermissions('kitchen.tickets.read')
  @Get()
  getActiveKots(
    @Query('store_id') store_id: string,
    @Query('includeReady') includeReady?: string,
  ) {
    console.log(`[GET] Active KOTs — Store: ${store_id}`);
    return this.service.getActiveKots(Number(store_id), includeReady === 'true');
  }

  // GET /kots/history?store_id=1&business_day_id=5
  @RequirePermissions('kitchen.tickets.read')
  @Get('history')
  getKotsByDay(
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id: string,
  ) {
    return this.service.getKotsByDay(Number(store_id), Number(business_day_id));
  }

  // GET /kots/:id
  @RequirePermissions('kitchen.tickets.read')
  @Get(':id')
  getKot(@Param('id') id: string) {
    return this.service.getKot(Number(id));
  }

  // PATCH /kots/:id/accept — Chef accepts an incoming ticket into preparation
  @RequirePermissions('kitchen.tickets.accept')
  @Patch(':id/accept')
  acceptKot(@Param('id') id: string) {
    console.log(`[KDS] KOT #${id} → PREPARING (accept)`);
    return this.service.acceptKOT(Number(id));
  }

  // PATCH /kots/:id/bump — Chef marks a ticket ready (may trigger a
  // Rider-facing delivery offer / Website order-tracking update)
  @RequirePermissions('kitchen.tickets.bump')
  @Patch(':id/bump')
  bumpKot(@Param('id') id: string) {
    console.log(`[KDS] KOT #${id} → READY (bump)`);
    return this.service.bumpKOT(Number(id));
  }

  // PATCH /kots/:id/cancel — cancel a kitchen ticket only; does NOT cancel
  // the underlying Order (see KotsService.updateKotStatus)
  @RequirePermissions('kitchen.tickets.cancel')
  @Patch(':id/cancel')
  cancelKot(@Param('id') id: string) {
    console.log(`[KDS] KOT #${id} → CANCELLED (cancel)`);
    return this.service.cancelKOT(Number(id));
  }

  // POST /kots/:id/print — Print button دبایا
  @RequirePermissions('sales.create')
  @Post(':id/print')
  incrementPrint(@Param('id') id: string) {
    return this.service.incrementPrintCount(Number(id));
  }
}
