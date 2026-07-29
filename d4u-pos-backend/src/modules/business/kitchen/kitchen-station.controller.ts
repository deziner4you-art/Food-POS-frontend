import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { KitchenStationService } from './kitchen-station.service';
import { CreateKitchenStationDto, UpdateKitchenStationDto, AssignProductStationDto } from './dto';

@Controller('kitchen/stations')
export class KitchenStationController {
  constructor(private readonly service: KitchenStationService) {}

  @RequirePermissions('kitchen.stations.read')
  @Get()
  list(@Query('store_id') store_id: string) {
    return this.service.listStations(Number(store_id));
  }

  @RequirePermissions('kitchen.stations.read')
  @Get(':id/products')
  products(@Param('id') id: string) {
    return this.service.getStationProducts(Number(id));
  }

  @RequirePermissions('kitchen.stations.manage')
  @Post()
  create(@Body() body: CreateKitchenStationDto, @CurrentUser() user: any) {
    return this.service.createStation(body.store_id, body.name, body.sort_order, user?.sub);
  }

  @RequirePermissions('kitchen.stations.manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateKitchenStationDto, @CurrentUser() user: any) {
    return this.service.updateStation(Number(id), body, user?.sub);
  }

  @RequirePermissions('kitchen.stations.manage')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deleteStation(Number(id), user?.sub);
  }

  @RequirePermissions('kitchen.stations.manage')
  @Post('assign-product')
  assignProduct(@Body() body: AssignProductStationDto, @CurrentUser() user: any) {
    return this.service.assignProduct(body.product_id, body.kitchen_station_id ?? null, user?.sub);
  }
}
