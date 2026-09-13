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
  Query,
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
  VerifyInventoryPinDto,
} from './dto';

// Multipart form fields sent once per checked checkbox arrive as a string
// (one value), an array of strings (multiple), or are omitted entirely
// (none checked) -- same normalization MarketingService.createCampaign
// already applies to its own target_store_ids.
function normalizeStoreIds(raw: any): number[] {
  return (Array.isArray(raw) ? raw : raw ? [raw] : []).map(Number);
}

// Shared by create and update so a banner's image can be replaced in place
// (previously only create accepted a file -- edit could only be reached by
// deleting the banner and re-uploading).
const bannerStorage = diskStorage({
  destination: './uploads',
  filename: (req: any, file: any, cb: any) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // --- Banners ---
  // store_id (when known -- the public website always knows its own store)
  // scopes results to that branch + any brand-wide banners, same convention
  // as GET /marketing/campaign?store_id=. Previously neither route accepted
  // store_id at all, so every banner for the brand showed on every branch.
  @Public()
  @Get('banners/:brand_id')
  getBannersByBrand(@Param('brand_id') brandId: string, @Query('store_id') storeId?: string) {
    return this.cmsService.getBanners(parseInt(brandId), storeId ? parseInt(storeId) : undefined);
  }

  @Public()
  @Get('banners')
  getBanners(@Query('brand_id') brandId?: string, @Query('store_id') storeId?: string) {
    return this.cmsService.getBanners(brandId ? parseInt(brandId) : 1, storeId ? parseInt(storeId) : undefined);
  }

  @RequirePermissions('system.create')
  @Post('banners')
  @UseInterceptors(FileInterceptor('image', { storage: bannerStorage }))
  createBanner(
    @UploadedFile() file: any, // Express.Multer.File
    @Body() body: CreateBannerDto,
  ) {
    const imageUrl = file ? `/uploads/${file.filename}` : body.imageUrl;

    return this.cmsService.createBanner({
      brand_id: body.brand_id ? parseInt(body.brand_id) : undefined,
      title: body.title,
      subtitle: body.subtitle,
      imageUrl: imageUrl as string,
      linkUrl: body.linkUrl,
      buttonText: body.buttonText,
      isActive: body.isActive === 'true' || body.isActive === true,
      displayOrder: body.displayOrder ? parseInt(body.displayOrder) : 0,
      target_store_ids: normalizeStoreIds(body.target_store_ids),
    });
  }

  // FileInterceptor only engages for multipart/form-data requests (sent when
  // the image is being replaced); plain JSON PATCHes (text-only edits, the
  // drag-reorder handler) pass through it unaffected -- same route either way.
  @RequirePermissions('system.update')
  @Patch('banners/:id')
  @UseInterceptors(FileInterceptor('image', { storage: bannerStorage }))
  updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any, // Express.Multer.File
    @Body() body: UpdateBannerDto,
  ) {
    if (body.target_store_ids !== undefined) {
      (body as any).target_store_ids = normalizeStoreIds(body.target_store_ids);
    }
    if (body.isActive !== undefined) {
      (body as any).isActive = body.isActive === true || body.isActive === 'true';
    }
    if (body.displayOrder !== undefined) {
      (body as any).displayOrder =
        typeof body.displayOrder === 'string' ? parseInt(body.displayOrder, 10) : body.displayOrder;
    }
    if (file) {
      (body as any).imageUrl = `/uploads/${file.filename}`;
    }
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
  getSettings(@Query('store_id') storeId?: string) {
    const id = (storeId && storeId !== 'undefined') ? parseInt(storeId, 10) : 1;
    return this.cmsService.getSettings(id);
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

  // Gated with the same permission Chef Login already requires (a logged-in
  // KDS terminal), rather than introducing a brand-new permission key just
  // for this. Only ever returns a boolean — never the PIN or its hash.
  @RequirePermissions('kitchen.sessions.create')
  @Post('settings/:storeId/verify-inventory-pin')
  async verifyInventoryPin(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: VerifyInventoryPinDto,
  ) {
    const valid = await this.cmsService.verifyInventoryPin(storeId, body.pin);
    return { valid };
  }
}
