import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { RiderService } from './rider.service';
import { UpdateGpsDto, ClaimOrderDto } from './dto';

@Controller('rider')
export class RiderController {
  constructor(private readonly service: RiderService) {}

  @RequirePermissions('system.create')
  @Post('gps')
  updateGps(@Body() body: UpdateGpsDto) {
    return this.service.updateRiderGps(body);
  }

  @RequirePermissions('system.view')
  @Get('gps/:orderId')
  getRiderGps(@Param('orderId') orderId: string) {
    return this.service.getRiderGps(orderId);
  }
}

@Controller('rider-orders')
export class RiderOrdersController {
  constructor(private readonly service: RiderService) {}

  @RequirePermissions('system.view')
  @Get()
  getRiderOrders(@Query('store_id') storeId: string) {
    return this.service.getRiderOrders(storeId);
  }

  @RequirePermissions('system.view')
  @Patch(':id/claim')
  claimOrder(@Param('id') id: string, @Body() body: ClaimOrderDto) {
    return this.service.claimOrder(Number(id), Number(body.riderId), body.riderName);
  }
}
