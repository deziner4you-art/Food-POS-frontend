import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { RequireModule, RequirePermissions, CurrentUser } from '../../../common/decorators';
import { assertTenantStoreAccess } from '../../../common/utils/tenant.util';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { KotsService } from './kots.service';

@Controller('kots')
// KOT printing and the actionable POS KOT workflow are part of BASE_POS;
// they must not be confused with the separate KDS screen entitlement.
@RequireModule('KOT_PRINT')
export class KotsController {
  constructor(
    private readonly service: KotsService,
    private readonly prisma: PrismaService,
  ) {}

  private async authorizeKot(user: any, id: number) {
    const kot = await this.service.getKot(id);
    await assertTenantStoreAccess(this.prisma, user, kot.store_id);
    return kot;
  }

  // GET /kots?store_id=1 — KDS اسکرین (active tickets)
  // includeReady=true additionally returns READY tickets from the last 5
  // minutes — opt-in, default omitted (false) preserves the exact prior
  // response for any caller not passing it.
  @RequirePermissions('kitchen.tickets.read')
  @Get()
  getActiveKots(
    @CurrentUser() user: any,
    @Query('store_id') store_id: string,
    @Query('includeReady') includeReady?: string,
  ) {
    return assertTenantStoreAccess(this.prisma, user, Number(store_id)).then(() => {
      console.log(`[GET] Active KOTs — Store: ${store_id}`);
      return this.service.getActiveKots(Number(store_id), includeReady === 'true');
    });
  }

  // TV Board has its own paid entitlement. Do not let a KOT_PRINT-only tenant
  // reuse the generic KOT feed to power a customer-facing display.
  @RequireModule('TV_BOARD')
  @RequirePermissions('kitchen.tickets.read')
  @Get('tv-board')
  getTvBoardKots(
    @CurrentUser() user: any,
    @Query('store_id') store_id: string,
    @Query('includeReady') includeReady?: string,
  ) {
    return assertTenantStoreAccess(this.prisma, user, Number(store_id)).then(() =>
      this.service.getActiveKots(Number(store_id), includeReady === 'true'),
    );
  }

  // GET /kots/history?store_id=1&business_day_id=5
  @RequirePermissions('kitchen.tickets.read')
  @Get('history')
  getKotsByDay(
    @CurrentUser() user: any,
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id: string,
  ) {
    return assertTenantStoreAccess(this.prisma, user, Number(store_id)).then(() =>
      this.service.getKotsByDay(Number(store_id), Number(business_day_id)),
    );
  }

  // GET /kots/:id
  @RequirePermissions('kitchen.tickets.read')
  @Get(':id')
  getKot(@CurrentUser() user: any, @Param('id') id: string) {
    return this.authorizeKot(user, Number(id));
  }

  // PATCH /kots/:id/accept — Chef accepts an incoming ticket into preparation
  @RequirePermissions('kitchen.tickets.accept')
  @Patch(':id/accept')
  async acceptKot(@CurrentUser() user: any, @Param('id') id: string) {
    await this.authorizeKot(user, Number(id));
    console.log(`[KDS] KOT #${id} → PREPARING (accept)`);
    return this.service.acceptKOT(Number(id));
  }

  // PATCH /kots/:id/bump — Chef marks a ticket ready (may trigger a
  // Rider-facing delivery offer / Website order-tracking update)
  @RequirePermissions('kitchen.tickets.bump')
  @Patch(':id/bump')
  async bumpKot(@CurrentUser() user: any, @Param('id') id: string) {
    await this.authorizeKot(user, Number(id));
    console.log(`[KDS] KOT #${id} → READY (bump)`);
    return this.service.bumpKOT(Number(id));
  }

  // PATCH /kots/:id/cancel — cancel a kitchen ticket only; does NOT cancel
  // the underlying Order (see KotsService.updateKotStatus)
  @RequirePermissions('kitchen.tickets.cancel')
  @Patch(':id/cancel')
  async cancelKot(@CurrentUser() user: any, @Param('id') id: string) {
    await this.authorizeKot(user, Number(id));
    console.log(`[KDS] KOT #${id} → CANCELLED (cancel)`);
    return this.service.cancelKOT(Number(id));
  }

  // POST /kots/:id/print — Print button دبایا
  @RequirePermissions('sales.create')
  @Post(':id/print')
  async incrementPrint(@CurrentUser() user: any, @Param('id') id: string) {
    await this.authorizeKot(user, Number(id));
    return this.service.incrementPrintCount(Number(id));
  }
}
