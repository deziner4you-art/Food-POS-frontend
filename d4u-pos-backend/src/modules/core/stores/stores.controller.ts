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
  @RequirePermissions('workspace.branches.read')
  @Get()
  getAllStores(@Req() req: any) {
    return this.storesService.getAllStores(req.user);
  }

  @RequirePermissions('workspace.branches.read')
  @Get('recycle-bin/stores')
  getDeletedStores() {
    return this.storesService.getDeletedStores();
  }

  @RequirePermissions('workspace.brands.read')
  @Get('recycle-bin/brands')
  getDeletedBrands() {
    return this.storesService.getDeletedBrands();
  }

  @RequirePermissions('workspace.brands.delete')
  @Post('bulk-delete-brands')
  bulkDeleteBrands(@Body() body: { brandIds: number[], password: string, reason: string }, @Req() req: any) {
    return this.storesService.bulkDeleteBrandsWithPassword(body.brandIds, req.user.sub, body.password, body.reason || 'User requested deletion');
  }

  @RequirePermissions('workspace.branches.delete')
  @Post('bulk-delete')
  bulkDeleteStores(@Body() body: { storeIds: number[], password: string, reason: string }, @Req() req: any) {
    return this.storesService.bulkDeleteStoresWithPassword(body.storeIds, req.user.sub, body.password, body.reason || 'User requested deletion');
  }

  // Task #2R-B2: migrated off the legacy 2-segment 'system.update' onto the
  // real 'workspace.branches.restore' catalog permission -- every other
  // route in this controller already correctly used 'workspace.branches.*'.
  // Straight swap, not additive -- 'system.update' was never in the
  // posPermissions bridge, so this route was Super-Admin-only before and
  // remains Super-Admin-only after (no role grant added for the new
  // permission), a pure rename with zero access change.
  @RequirePermissions('workspace.branches.restore')
  @Post('recycle-bin/restore-stores')
  restoreStores(@Body() body: { storeIds: number[] }, @Req() req: any) {
    const masterKey = req.headers['x-master-key'] as string;
    return this.storesService.restoreStores(body.storeIds, masterKey);
  }

  // Task #2R-B2: same reasoning as restoreStores above, onto
  // 'workspace.brands.restore'.
  @RequirePermissions('workspace.brands.restore')
  @Post('recycle-bin/restore-brands')
  restoreBrands(@Body() body: { brandIds: number[] }, @Req() req: any) {
    const masterKey = req.headers['x-master-key'] as string;
    return this.storesService.restoreBrands(body.brandIds, masterKey);
  }

  @Public()
  @RequirePermissions('workspace.brands.read')
  @Get('brands')
  getAllBrands(@Req() req: any) {
    const tenantBrandId = req.user?.role === 'Super Admin' ? undefined : req.user?.brand_id;
    return this.storesService.getAllBrands(tenantBrandId);
  }

  @RequirePermissions('workspace.branches.read')
  @Get(':id')
  getStore(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.storesService.getStore(id, req.user);
  }

  @RequirePermissions('workspace.branches.create')
  @Post()
  createStore(@Body() body: CreateStoreDto) {
    return this.storesService.createStore(body);
  }

  @RequirePermissions('workspace.branches.update')
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

  @RequirePermissions('workspace.branches.update')
  @Patch(':id')
  updateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(id, body);
  }

  @RequirePermissions('workspace.branches.delete')
  @Delete(':id')
  deleteStore(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.deleteStore(id);
  }
}
