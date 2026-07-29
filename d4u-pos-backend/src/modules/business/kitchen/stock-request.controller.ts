import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { StockRequestService } from './stock-request.service';
import { CreateStockRequestDto, ResolveStockRequestDto } from './dto';

@Controller('kitchen/stock-requests')
export class StockRequestController {
  constructor(private readonly service: StockRequestService) {}

  @RequirePermissions('kitchen.stock_requests.create')
  @Post()
  create(@Body() body: CreateStockRequestDto) {
    return this.service.create(body);
  }

  @RequirePermissions('kitchen.stock_requests.read')
  @Get()
  list(@Query('store_id') store_id: string, @Query('status') status?: string) {
    return this.service.list(Number(store_id), status);
  }

  @RequirePermissions('kitchen.stock_requests.approve')
  @Post(':id/resolve')
  resolve(@Param('id') id: string, @Body() body: ResolveStockRequestDto) {
    return this.service.resolve(Number(id), body.status, body.approved_by, body.fulfilled_qty);
  }
}
