import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('category')
  createCategory(@Body() body: { store_id: number, name: string }) {
    return this.catalogService.createCategory(body.store_id, body.name);
  }

  @Post('product')
  createProduct(@Body() body: any) {
    return this.catalogService.createProduct(body);
  }

  @Get('sync/:store_id')
  syncCatalog(@Param('store_id', ParseIntPipe) storeId: number) {
    return this.catalogService.syncCatalogForPos(storeId);
  }
}
