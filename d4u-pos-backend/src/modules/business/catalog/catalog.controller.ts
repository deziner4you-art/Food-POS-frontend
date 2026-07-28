import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { RequirePermissions, Public } from '../../../common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { CatalogService } from './catalog.service';
import {
  CreateMenuDto,
  UpdateMenuDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto';

const MENU_PRODUCTS_DIR = join(process.cwd(), 'uploads', 'menu-products');
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PRODUCT_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

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
      body.is_active,
      body.sort_order,
      body.image_url,
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

  // -------------------------------------------------------------
  // PRODUCT CSV IMPORT / EXPORT (Menu Builder bulk editing)
  // -------------------------------------------------------------
  @RequirePermissions('catalog.view')
  @Get('products/export')
  async exportProducts(@Res() res: Response) {
    const csv = await this.service.exportProductsCsv();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="menu-products.csv"',
    });
    res.send(csv);
  }

  @RequirePermissions('catalog.create')
  @Post('products/import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  importProducts(@Query('store_id') store_id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No CSV file received.');
    if (!store_id) throw new BadRequestException('store_id is required.');
    console.log(`[PRODUCT IMPORT] CSV upload for store ${store_id} — ${file.originalname}`);
    return this.service.importProductsCsv(Number(store_id), file.buffer);
  }

  // -------------------------------------------------------------
  // PRODUCT IMAGE (upload / replace / remove)
  // -------------------------------------------------------------
  @RequirePermissions('catalog.update')
  @Post('products/:id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(MENU_PRODUCTS_DIR, { recursive: true });
          cb(null, MENU_PRODUCTS_DIR);
        },
        filename: (_req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
          cb(new BadRequestException('Unsupported file type. Only JPG, PNG, and WEBP are allowed.'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_PRODUCT_IMAGE_BYTES },
    }),
  )
  uploadProductImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file received.');
    console.log(`[PRODUCT IMAGE] Upload for #${id} — ${file.originalname} (${file.size} bytes)`);
    return this.service.setProductImage(Number(id), file);
  }

  @RequirePermissions('catalog.update')
  @Delete('products/:id/image')
  deleteProductImage(@Param('id') id: string) {
    console.log(`[PRODUCT IMAGE] Remove for #${id}`);
    return this.service.removeProductImage(Number(id));
  }
}
