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
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  getAllStores() {
    return this.storesService.getAllStores();
  }

  @Get('brands')
  getAllBrands() {
    return this.storesService.getAllBrands();
  }

  @Get(':id')
  getStore(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.getStore(id);
  }

  @Post()
  createStore(@Body() body: CreateStoreDto) {
    return this.storesService.createStore(body);
  }

  @Patch(':id')
  updateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(id, body);
  }

  @Delete(':id')
  deleteStore(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.deleteStore(id);
  }
}
