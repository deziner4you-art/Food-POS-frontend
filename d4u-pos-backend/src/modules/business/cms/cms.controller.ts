import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CmsService } from './cms.service';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // --- Banners ---
  @Get('banners/:brand_id')
  getBannersByBrand(@Param('brand_id') brandId: string) {
    return this.cmsService.getBanners(parseInt(brandId));
  }

  @Get('banners')
  getBanners() {
    return this.cmsService.getBanners(1);
  }

  @Post('banners')
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
  createBanner(
    @UploadedFile() file: any, // Express.Multer.File
    @Body() body: any,
  ) {
    const imageUrl = file ? `/uploads/${file.filename}` : body.imageUrl;

    return this.cmsService.createBanner({
      brand_id: body.brand_id ? parseInt(body.brand_id) : 1,
      title: body.title,
      subtitle: body.subtitle,
      imageUrl: imageUrl,
      linkUrl: body.linkUrl,
      buttonText: body.buttonText,
      isActive: body.isActive === 'true' || body.isActive === true,
      displayOrder: body.displayOrder ? parseInt(body.displayOrder) : 0,
    });
  }

  @Patch('banners/:id')
  updateBanner(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.cmsService.updateBanner(id, body);
  }

  @Delete('banners/:id')
  deleteBanner(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteBanner(id);
  }

  // --- Settings ---
  @Get('settings/:store_id')
  getSettingsByStore(@Param('store_id') storeId: string) {
    return this.cmsService.getSettings(parseInt(storeId));
  }

  @Get('settings')
  getSettings() {
    return this.cmsService.getSettings(1);
  }

  @Patch('settings/:storeId')
  updateSettings(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: any,
  ) {
    return this.cmsService.updateSettings(storeId, body);
  }

  @Post('subscribe')
  subscribe(@Body() body: { store_id: number; email: string }) {
    return this.cmsService.subscribeNewsletter(body.store_id, body.email);
  }
}
