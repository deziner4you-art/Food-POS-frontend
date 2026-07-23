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
import { RequirePermissions, Public } from '../../../common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CmsService } from './cms.service';
import {
  CreateBannerDto,
  UpdateBannerDto,
  UpdateSettingsDto,
  SubscribeDto,
} from './dto';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // --- Banners ---
  @Public()
  @Get('banners/:brand_id')
  getBannersByBrand(@Param('brand_id') brandId: string) {
    return this.cmsService.getBanners(parseInt(brandId));
  }

  @Public()
  @Get('banners')
  getBanners() {
    return this.cmsService.getBanners(1);
  }

  @RequirePermissions('system.create')
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
    @Body() body: CreateBannerDto,
  ) {
    const imageUrl = file ? `/uploads/${file.filename}` : body.imageUrl;

    return this.cmsService.createBanner({
      brand_id: body.brand_id ? parseInt(body.brand_id) : 1,
      title: body.title,
      subtitle: body.subtitle,
      imageUrl: imageUrl as string,
      linkUrl: body.linkUrl,
      buttonText: body.buttonText,
      isActive: body.isActive === 'true' || body.isActive === true,
      displayOrder: body.displayOrder ? parseInt(body.displayOrder) : 0,
    });
  }

  @RequirePermissions('system.update')
  @Patch('banners/:id')
  updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBannerDto,
  ) {
    return this.cmsService.updateBanner(id, body);
  }

  @RequirePermissions('system.delete')
  @Delete('banners/:id')
  deleteBanner(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteBanner(id);
  }

  // --- Settings ---
  @Public()
  @Get('settings/:store_id')
  getSettingsByStore(@Param('store_id') storeId: string) {
    return this.cmsService.getSettings(parseInt(storeId));
  }

  @Public()
  @Get('settings')
  getSettings() {
    return this.cmsService.getSettings(1);
  }

  @RequirePermissions('system.update')
  @Patch('settings/:storeId')
  updateSettings(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: UpdateSettingsDto,
  ) {
    return this.cmsService.updateSettings(storeId, body);
  }

  @RequirePermissions('system.create')
  @Post('subscribe')
  subscribe(@Body() body: SubscribeDto) {
    return this.cmsService.subscribeNewsletter(body.store_id, body.email);
  }
}
