import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { KitchenDashboardService } from './kitchen-dashboard.service';
import { TicketActionDto } from './dto';

@Controller('kitchen')
export class KitchenDashboardController {
  constructor(private readonly service: KitchenDashboardService) {}

  @RequirePermissions('kitchen.tickets.read')
  @Get('tickets')
  getTickets(@Query('store_id') store_id: string, @Query('kitchen_station_id') kitchen_station_id?: string) {
    return this.service.getActiveTickets(Number(store_id), kitchen_station_id ? Number(kitchen_station_id) : undefined);
  }

  @RequirePermissions('kitchen.tickets.bump')
  @Post('tickets/:id/accept')
  accept(@Param('id') id: string, @Body() body: TicketActionDto, @CurrentUser() user: any) {
    return this.service.acceptTicket(Number(id), body?.user_id ?? user?.sub);
  }

  @RequirePermissions('kitchen.tickets.bump')
  @Post('tickets/:id/bump')
  bump(@Param('id') id: string, @Body() body: TicketActionDto, @CurrentUser() user: any) {
    return this.service.bumpTicket(Number(id), body?.user_id ?? user?.sub);
  }

  @RequirePermissions('kitchen.tickets.recall')
  @Post('tickets/:id/recall')
  recall(@Param('id') id: string, @Body() body: TicketActionDto, @CurrentUser() user: any) {
    return this.service.recallTicket(Number(id), body?.user_id ?? user?.sub);
  }

  @RequirePermissions('kitchen.dashboard.read')
  @Get('dashboard')
  dashboard(@Query('store_id') store_id: string) {
    return this.service.getDashboard(Number(store_id));
  }
}
