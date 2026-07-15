import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  // -------------------------------------------------------------
  // POS SYNC
  // -------------------------------------------------------------
  @Get('sync/:store_id')
  syncCatalog(@Param('store_id') store_id: string) {
    console.log(`[CATALOG SYNC] Store: ${store_id}`);
    return this.service.syncCatalogForPos(Number(store_id));
  }

  // -------------------------------------------------------------
  // MENUS
  // -------------------------------------------------------------
  @Get('menus')
  getMenus() {
    return this.service.getMenus();
  }

  @Post('menus')
  createMenu(@Body() body: { name: string; brand_id?: number; store_ids?: number[] }) {
    console.log(`[NEW MENU] ${body.name}`);
    return this.service.createMenu(body);
  }

  @Patch('menus/:id')
  updateMenu(@Param('id') id: string, @Body() body: { name?: string; store_ids?: number[] }) {
    console.log(`[UPDATE MENU] #${id}`);
    return this.service.updateMenu(Number(id), body);
  }

  @Post('menus/:id/duplicate')
  duplicateMenu(@Param('id') id: string) {
    console.log(`[DUPLICATE MENU] #${id}`);
    return this.service.duplicateMenu(Number(id));
  }

  @Delete('menus/:id')
  deleteMenu(@Param('id') id: string) {
    console.log(`[DELETE MENU] #${id}`);
    return this.service.deleteMenu(Number(id));
  }

  // -------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------
  @Get('categories')
  getCategories(@Query('store_id') store_id: string) {
    return this.service.getCategories(Number(store_id));
  }

  @Post('categories')
  createCategory(@Body() body: { store_id: number; name: string; menu_id?: number; store_ids?: number[] }) {
    console.log(`[NEW CATEGORY] ${body.name}`);
    return this.service.createCategory(body.store_id, body.name, body.menu_id, body.store_ids);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: { name?: string; menu_id?: number; store_ids?: number[] }) {
    console.log(`[UPDATE CATEGORY] #${id}`);
    return this.service.updateCategory(Number(id), body);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    console.log(`[DELETE CATEGORY] #${id}`);
    return this.service.deleteCategory(Number(id));
  }

  // -------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------
  @Get('products')
  getProducts(@Query('store_id') store_id: string) {
    return this.service.getProducts(Number(store_id));
  }

  @Post('products')
  createProduct(
    @Body()
    body: {
      store_id: number;
      category_ids: number[];
      name: string;
      price: number;
      cost: number;
      margin_pct: number;
      sku?: string;
      image_url?: string;
      status?: string;
      assigned_store_ids?: number[];
    },
  ) {
    console.log(`[NEW PRODUCT] ${body.name} — Rs.${body.price}`);
    return this.service.createProduct(body);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body() body: { name?: string; price?: number; cost?: number; margin_pct?: number; is_active?: boolean; sku?: string; image_url?: string; status?: string; assigned_store_ids?: number[]; category_ids?: number[] },
  ) {
    console.log(`[UPDATE PRODUCT] #${id}`);
    return this.service.updateProduct(Number(id), body);
  }

  @Patch('products/:id/approve')
  approveProduct(@Param('id') id: string) {
    console.log(`[APPROVE PRODUCT] #${id}`);
    return this.service.approveProduct(Number(id));
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    console.log(`[DELETE PRODUCT] #${id}`);
    return this.service.deleteProduct(Number(id));
  }
}
