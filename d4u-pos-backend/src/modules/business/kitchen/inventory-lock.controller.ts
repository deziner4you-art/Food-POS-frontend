import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { InventoryLockService } from './inventory-lock.service';
import { CreateInventoryLockDto, UnlockInventoryDto } from './dto';

@Controller('kitchen/inventory-locks')
export class InventoryLockController {
  constructor(private readonly service: InventoryLockService) {}

  @RequirePermissions('kitchen.inventory_locks.read')
  @Get()
  list(@Query('store_id') store_id: string) {
    return this.service.listActiveLocks(Number(store_id));
  }

  @RequirePermissions('kitchen.inventory_locks.read')
  @Get(':inventory_id/status')
  status(@Param('inventory_id') inventory_id: string) {
    return this.service.isLocked(Number(inventory_id)).then((locked) => ({ locked }));
  }

  @RequirePermissions('kitchen.inventory_locks.create')
  @Post()
  create(@Body() body: CreateInventoryLockDto, @CurrentUser() user: any) {
    return this.service.lockItem(body.store_id, body.inventory_id, body.reason, body.kot_id, body.locked_by ?? user?.sub);
  }

  @RequirePermissions('kitchen.inventory_locks.unlock')
  @Post(':id/unlock')
  unlock(@Param('id') id: string, @Body() body: UnlockInventoryDto) {
    return this.service.unlockItem(Number(id), body.manager_pin, body.approved_by);
  }
}
