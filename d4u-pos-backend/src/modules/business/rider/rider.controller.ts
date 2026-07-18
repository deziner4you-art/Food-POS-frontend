import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RiderService } from './rider.service';

@Controller('rider')
export class RiderController {
  constructor(private readonly service: RiderService) {}

  @Post('gps')
  updateGps(@Body() body: any) {
    return this.service.updateRiderGps(body);
  }

  @Get('gps/:orderId')
  getRiderGps(@Param('orderId') orderId: string) {
    return this.service.getRiderGps(orderId);
  }
}

@Controller('rider-orders')
export class RiderOrdersController {
  constructor(private readonly service: RiderService) {}

  @Get()
  getRiderOrders(@Query('store_id') storeId: string) {
    return this.service.getRiderOrders(storeId);
  }
}

@Controller('dispatch-order')
export class DispatchOrderController {
  constructor(private readonly service: RiderService) {}

  @Post()
  dispatchOrder(@Body() body: any) {
    return this.service.dispatchOrder(body);
  }
}

@Controller('settle-order')
export class SettleOrderController {
  constructor(private readonly service: RiderService) {}

  @Post(':id')
  settleOrder(@Param('id') id: string) {
    return this.service.settleOrder(id);
  }
}
