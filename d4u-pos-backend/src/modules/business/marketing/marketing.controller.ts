import {
  Controller,
  Post,
  Get,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MarketingService } from './marketing.service';
import {
  CalculateSlaDto,
  GenerateLinkDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  ScheduleDiscountDto,
  UpdateScheduledDiscountDto,
} from './dto';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @RequirePermissions('crm.create')
  @Post('sla-performance')
  calculateSla(@Body() body: CalculateSlaDto) {
    return this.marketingService.calculateSlaPerformance(
      body.agency,
      body.target,
      body.achieved,
      body.retainer,
    );
  }

  @RequirePermissions('crm.create')
  @Post('generate-affiliate-link')
  generateLink(@Body() body: GenerateLinkDto) {
    return this.marketingService.generateAffiliateLink(
      body.affiliate_id,
      body.store_id,
      body.platform,
    );
  }

  @RequirePermissions('crm.create')
  @Post('campaign')
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
  createCampaign(@UploadedFile() file: any, @Body() body: CreateCampaignDto) {
    if (file) body.image_url = `/uploads/${file.filename}`;
    return this.marketingService.createCampaign(body);
  }

  @RequirePermissions('crm.view')
  @Get('campaign')
  getCampaigns(@Query('store_id') store_id?: string) {
    return this.marketingService.getCampaigns(
      store_id ? parseInt(store_id, 10) : undefined,
    );
  }

  @RequirePermissions('crm.update')
  @Patch('campaign/:id')
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
  updateCampaign(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() body: UpdateCampaignDto,
  ) {
    if (file) body.image_url = `/uploads/${file.filename}`;
    return this.marketingService.updateCampaign(parseInt(id), body);
  }

  @RequirePermissions('crm.delete')
  @Delete('campaign/:id')
  deleteCampaign(@Param('id') id: string) {
    return this.marketingService.deleteCampaign(parseInt(id));
  }

  @Post('analytics/:id/:event')
  trackAnalytics(@Param('id') id: string, @Param('event') event: string, @Body() body: any) {
    return this.marketingService.trackAnalytics(parseInt(id), event, body?.revenue);
  }

  @RequirePermissions('crm.view')
  @Get('kpis')
  getKPIs() {
    return this.marketingService.getKPIs();
  }

  // SCHEDULED DISCOUNTS
  @RequirePermissions('crm.create')
  @Post('schedule')
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
  createScheduledDiscount(
    @UploadedFile() file: any,
    @Body() body: ScheduleDiscountDto,
  ) {
    if (file) body.image_url = `/uploads/${file.filename}`;
    return this.marketingService.createScheduledDiscount(body);
  }

  @RequirePermissions('crm.view')
  @Get('schedule')
  getScheduledDiscounts() {
    return this.marketingService.getScheduledDiscounts();
  }

  @RequirePermissions('crm.update')
  @Patch('schedule/:id')
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
  updateScheduledDiscount(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() body: UpdateScheduledDiscountDto,
  ) {
    if (file) body.image_url = `/uploads/${file.filename}`;
    return this.marketingService.updateScheduledDiscount(parseInt(id), body);
  }

  @RequirePermissions('crm.delete')
  @Delete('schedule/:id')
  deleteScheduledDiscount(@Param('id') id: string) {
    return this.marketingService.deleteScheduledDiscount(parseInt(id));
  }
}
