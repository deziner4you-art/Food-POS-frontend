import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { RequirePermissions, Public } from '../../../common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CatalogService } from './catalog.service';
import {
  CreateMenuDto,
  UpdateMenuDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  // -------------------------------------------------------------
  // POS SYNC
  // -------------------------------------------------------------
  @Public()
  @Get('sync/:store_id')
  syncCatalog(@Param('store_id') store_id: string) {
    console.log(`[CATALOG SYNC] Store: ${store_id}`);
    return this.service.syncCatalogForPos(Number(store_id));
  }

  @RequirePermissions('catalog.create')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req: any, file: any, cb: any) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadImage(@UploadedFile() file: any) {
    if (!file) return { imageUrl: null };
    return { imageUrl: `/uploads/${file.filename}` };
  }

  // -------------------------------------------------------------
  // MENUS
  // -------------------------------------------------------------
  @RequirePermissions('catalog.view')
  @Get('menus')
  getMenus() {
    return this.service.getMenus();
  }

  @RequirePermissions('catalog.create')
  @Post('menus')
  createMenu(@Body() body: CreateMenuDto) {
    console.log(`[NEW MENU] ${body.name}`);
    return this.service.createMenu(body);
  }

  @RequirePermissions('catalog.update')
  @Patch('menus/:id')
  updateMenu(@Param('id') id: string, @Body() body: UpdateMenuDto) {
    console.log(`[UPDATE MENU] #${id}`);
    return this.service.updateMenu(Number(id), body);
  }

  @RequirePermissions('catalog.create')
  @Post('menus/:id/duplicate')
  duplicateMenu(@Param('id') id: string) {
    console.log(`[DUPLICATE MENU] #${id}`);
    return this.service.duplicateMenu(Number(id));
  }

  @RequirePermissions('catalog.delete')
  @Delete('menus/:id')
  deleteMenu(@Param('id') id: string) {
    console.log(`[DELETE MENU] #${id}`);
    return this.service.deleteMenu(Number(id));
  }

  // -------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------
  @RequirePermissions('catalog.view')
  @Get('categories')
  getCategories(@Query('store_id') store_id: string) {
    return this.service.getCategories(Number(store_id));
  }

  @RequirePermissions('catalog.create')
  @Post('categories')
  createCategory(@Body() body: CreateCategoryDto) {
    console.log(`[NEW CATEGORY] ${body.name}`);
    return this.service.createCategory(
      body.store_id,
      body.name,
      body.menu_id,
      body.store_ids,
    );
  }

  @RequirePermissions('catalog.update')
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    console.log(`[UPDATE CATEGORY] #${id}`);
    return this.service.updateCategory(Number(id), body);
  }

  @RequirePermissions('catalog.delete')
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    console.log(`[DELETE CATEGORY] #${id}`);
    return this.service.deleteCategory(Number(id));
  }

  // -------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------
  @RequirePermissions('catalog.view')
  @Get('products')
  getProducts(@Query('store_id') store_id: string) {
    return this.service.getProducts(Number(store_id));
  }

  @RequirePermissions('catalog.create')
  @Post('products')
  createProduct(@Body() body: CreateProductDto) {
    console.log(`[NEW PRODUCT] ${body.name} — Rs.${body.price}`);
    return this.service.createProduct(body);
  }

  @RequirePermissions('catalog.update')
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: UpdateProductDto) {
    console.log(`[UPDATE PRODUCT] #${id}`);
    return this.service.updateProduct(Number(id), body);
  }

  @RequirePermissions('catalog.approve')
  @Patch('products/:id/approve')
  approveProduct(@Param('id') id: string) {
    console.log(`[APPROVE PRODUCT] #${id}`);
    return this.service.approveProduct(Number(id));
  }

  @RequirePermissions('catalog.delete')
  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    console.log(`[DELETE PRODUCT] #${id}`);
    return this.service.deleteProduct(Number(id));
  }
}
