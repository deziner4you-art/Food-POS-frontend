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

  @Post('sla-performance')
  calculateSla(@Body() body: CalculateSlaDto) {
    return this.marketingService.calculateSlaPerformance(
      body.agency,
      body.target,
      body.achieved,
      body.retainer,
    );
  }

  @Post('generate-affiliate-link')
  generateLink(@Body() body: GenerateLinkDto) {
    return this.marketingService.generateAffiliateLink(
      body.affiliate_id,
      body.store_id,
      body.platform,
    );
  }

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

  @Get('campaign')
  getCampaigns(@Query('store_id') store_id?: string) {
    return this.marketingService.getCampaigns(
      store_id ? parseInt(store_id, 10) : undefined,
    );
  }

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

  @Delete('campaign/:id')
  deleteCampaign(@Param('id') id: string) {
    return this.marketingService.deleteCampaign(parseInt(id));
  }

  // SCHEDULED DISCOUNTS
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

  @Get('schedule')
  getScheduledDiscounts() {
    return this.marketingService.getScheduledDiscounts();
  }

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

  @Delete('schedule/:id')
  deleteScheduledDiscount(@Param('id') id: string) {
    return this.marketingService.deleteScheduledDiscount(parseInt(id));
  }
}
