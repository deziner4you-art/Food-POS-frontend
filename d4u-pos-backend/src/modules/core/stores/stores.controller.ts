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
  @Get()
  getAllStores() {
    return this.storesService.getAllStores();
  }

  @RequirePermissions('system.view')
  @Get('recycle-bin')
  getDeletedStores() {
    return this.storesService.getDeletedStores();
  }

  @RequirePermissions('system.delete')
  @Post('bulk-delete-brands')
  bulkDeleteBrands(@Body() body: { brandIds: number[], password: string }, @Req() req: any) {
    return this.storesService.bulkDeleteBrandsWithPassword(body.brandIds, req.user.sub, body.password);
  }

  @RequirePermissions('system.delete')
  @Post('bulk-delete')
  bulkDeleteStores(@Body() body: { storeIds: number[], password: string }, @Req() req: any) {
    return this.storesService.bulkDeleteStoresWithPassword(body.storeIds, req.user.sub, body.password);
  }

  @RequirePermissions('system.update')
  @Post('restore')
  restoreStores(@Body() body: { storeIds: number[] }) {
    return this.storesService.restoreStores(body.storeIds);
  }

  @Public()
  @RequirePermissions('system.view')
  @Get('brands')
  getAllBrands(@Req() req: any) {
    const tenantBrandId = req.user?.brand_id === 1 ? undefined : req.user?.brand_id;
    return this.storesService.getAllBrands(tenantBrandId);
  }

  @RequirePermissions('system.view')
  @Get(':id')
  getStore(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.getStore(id);
  }

  @RequirePermissions('system.create')
  @Post()
  createStore(@Body() body: CreateStoreDto) {
    return this.storesService.createStore(body);
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
