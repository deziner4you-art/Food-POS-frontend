import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { RiderService } from './rider.service';
import { UpdateGpsDto, ClaimOrderDto } from './dto';

@Controller('rider')
export class RiderController {
  constructor(private readonly service: RiderService) {}

  // Task #2K: the rider identity recorded on the GPS ping comes exclusively
  // from the verified JWT (CurrentUser -> request.user.sub), never from the
  // request body -- see RiderService.updateRiderGps. UpdateGpsDto.riderId is
  // kept only for backward compatibility (the real rider app doesn't even
  // send it today; confirmed no current caller depends on it).
  // Task #2Q-B2: system.create never matched any seeded permission or the
  // sales.* compatibility bridge -- confirmed in #2Q-A/#2Q-B this route was
  // reachable by nobody except Super Admin. delivery.tracking.update is the
  // real permission (see #2Q-B1), granted to Rider.
  @RequirePermissions('delivery.tracking.update')
  @Post('gps')
  updateGps(@CurrentUser() user: any, @Body() body: UpdateGpsDto) {
    return this.service.updateRiderGps(body, user);
  }

  @RequirePermissions('delivery.tracking.read')
  @Get('gps/:orderId')
  getRiderGps(@Param('orderId') orderId: string) {
    return this.service.getRiderGps(orderId);
  }
}

@Controller('rider-orders')
export class RiderOrdersController {
  constructor(private readonly service: RiderService) {}

  @RequirePermissions('delivery.tracking.read')
  @Get()
  getRiderOrders(@Query('store_id') storeId: string) {
    return this.service.getRiderOrders(storeId);
  }

  // Task #2J: the claiming rider's identity comes exclusively from the
  // verified JWT (CurrentUser -> request.user.sub), never from the request
  // body. ClaimOrderDto.riderId is still accepted for backward
  // compatibility with the existing rider app's request shape, but the
  // server no longer trusts or reads it -- see RiderService.claimOrder.
  // Task #2Q-B2: system.view never matched any seeded permission or the
  // sales.* compatibility bridge -- confirmed in #2Q-A/#2Q-B this route was
  // reachable by nobody except Super Admin. delivery.dispatch.claim is the
  // real permission (see #2Q-B1), granted to Rider.
  @RequirePermissions('delivery.dispatch.claim')
  @Patch(':id/claim')
  claimOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: ClaimOrderDto,
  ) {
    return this.service.claimOrder(Number(id), user);
  }
}
