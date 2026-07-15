import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  getAllStores() {
    return this.storesService.getAllStores();
  }

  @Get(':id')
  getStore(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.getStore(id);
  }

  @Post()
  createStore(@Body() body: { name: string; brand_id: number; location?: string; is_online?: boolean; saas_package_id?: number }) {
    return this.storesService.createStore(body);
  }

  @Patch(':id')
  updateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; location?: string; is_online?: boolean; saas_package_id?: number },
  ) {
    return this.storesService.updateStore(id, body);
  }

  @Delete(':id')
  deleteStore(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.deleteStore(id);
  }
}
