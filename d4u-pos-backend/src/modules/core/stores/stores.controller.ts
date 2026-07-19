import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @RequirePermissions('system.view')
  @Get()
  getAllStores() {
    return this.storesService.getAllStores();
  }

  @RequirePermissions('system.view')
  @Get('brands')
  getAllBrands() {
    return this.storesService.getAllBrands();
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
