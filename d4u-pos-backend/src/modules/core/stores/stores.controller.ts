import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { RequirePermissions, Public } from '../../../common/decorators';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Public()
  @RequirePermissions('system.view')
  @Get()
  getAllStores(@Req() req: any) {
    return this.storesService.getAllStores(req.user);
  }

  @RequirePermissions('system.view')
  @Get('recycle-bin/stores')
  getDeletedStores() {
    return this.storesService.getDeletedStores();
  }

  @RequirePermissions('system.view')
  @Get('recycle-bin/brands')
  getDeletedBrands() {
    return this.storesService.getDeletedBrands();
  }

  @RequirePermissions('system.delete')
  @Post('bulk-delete-brands')
  bulkDeleteBrands(@Body() body: { brandIds: number[], password: string, reason: string }, @Req() req: any) {
    return this.storesService.bulkDeleteBrandsWithPassword(body.brandIds, req.user.sub, body.password, body.reason || 'User requested deletion');
  }

  @RequirePermissions('system.delete')
  @Post('bulk-delete')
  bulkDeleteStores(@Body() body: { storeIds: number[], password: string, reason: string }, @Req() req: any) {
    return this.storesService.bulkDeleteStoresWithPassword(body.storeIds, req.user.sub, body.password, body.reason || 'User requested deletion');
  }

  @RequirePermissions('system.update')
  @Post('recycle-bin/restore-stores')
  restoreStores(@Body() body: { storeIds: number[] }, @Req() req: any) {
    const masterKey = req.headers['x-master-key'] as string;
    return this.storesService.restoreStores(body.storeIds, masterKey);
  }

  @RequirePermissions('system.update')
  @Post('recycle-bin/restore-brands')
  restoreBrands(@Body() body: { brandIds: number[] }, @Req() req: any) {
    const masterKey = req.headers['x-master-key'] as string;
    return this.storesService.restoreBrands(body.brandIds, masterKey);
  }

  @Public()
  @RequirePermissions('system.view')
  @Get('brands')
  getAllBrands(@Req() req: any) {
    const tenantBrandId = req.user?.role === 'Super Admin' ? undefined : req.user?.brand_id;
    return this.storesService.getAllBrands(tenantBrandId);
  }

  @RequirePermissions('system.view')
  @Get(':id')
  getStore(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.storesService.getStore(id, req.user);
  }

  @RequirePermissions('system.create')
  @Post()
  createStore(@Body() body: CreateStoreDto) {
    return this.storesService.createStore(body);
  }

  @RequirePermissions('system.update')
  @Patch(':id/lifecycle')
  updateStoreLifecycle(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'ACTIVE' | 'SUSPENDED' | 'MAINTENANCE' | 'RECYCLED'; reason?: string; resume_at?: Date },
    @Req() req: any,
  ) {
    return this.storesService.updateStoreLifecycle(id, {
      ...body,
      changed_by: req.user?.name || 'Super Admin',
    });
  }

  @RequirePermissions('system.update')
  @Patch(':id')
  updateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(id, body);
  }

  @RequirePermissions('system.delete')
  @Delete(':id')
  deleteStore(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.deleteStore(id);
  }
}
