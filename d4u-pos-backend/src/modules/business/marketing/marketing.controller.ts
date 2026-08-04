import {
  Controller,
  Post,
  Get,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { RequirePermissions, CurrentUser, Public } from '../../../common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MarketingService, AuditMeta } from './marketing.service';
import type { MarketingChannel } from '../pos-orders/campaign-resolver.service';
import {
  CalculateSlaDto,
  GenerateLinkDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  ScheduleDiscountDto,
  UpdateScheduledDiscountDto,
} from './dto';

function buildMeta(user: any, req: any): AuditMeta {
  return {
    userId: user?.sub,
    ip: req?.ip,
    device: req?.headers?.['user-agent'],
  };
}

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
  createCampaign(
    @UploadedFile() file: any,
    @Body() body: CreateCampaignDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    if (file) body.image_url = `/uploads/${file.filename}`;
    return this.marketingService.createCampaign(body, buildMeta(user, req));
  }

  // MARKETING-003 §13/§14 — non-blocking dry-run conflict check the Admin UI
  // calls before save, without actually creating anything.
  @RequirePermissions('crm.create')
  @Post('campaign/check-conflicts')
  checkConflicts(@Body() body: any) {
    return this.marketingService.checkConflicts(body, body.id ? Number(body.id) : undefined);
  }

  // MARKETING-003 §1/§2 — Admin CRUD list (unfiltered by publish target) when
  // `channel` is omitted, for backward compatibility. Pass `channel` to route
  // through the shared CampaignResolverService instead — every consuming
  // surface (POS/Website/Customer App/Waiter/QR/Kiosk/TV) should do this.
  @RequirePermissions('crm.view')
  @Get('campaign')
  getCampaigns(
    @Query('store_id') store_id?: string,
    @Query('channel') channel?: MarketingChannel,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const storeId = store_id ? parseInt(store_id, 10) : undefined;
    if (channel) {
      return this.marketingService.getVisibleCampaigns(storeId, channel);
    }
    return this.marketingService.getCampaigns(storeId, includeArchived === 'true');
  }

  // Public counterpart of GET /marketing/campaign?channel=X — that route
  // requires crm.view (an authenticated staff permission), so every
  // unauthenticated public surface (Website, Customer App, QR, Kiosk, TV
  // Board) calling it with no staff JWT always got 401 and silently showed
  // no promotions. resolveVisibleCampaigns is already the pre-filtered,
  // display-safe subset (RUNNING + approved + published-for-channel +
  // within date/schedule window) — the same safety guarantee /catalog and
  // /online-orders/track already rely on for public exposure.
  @Public()
  @Get('campaign/visible')
  getVisibleCampaignsPublic(
    @Query('store_id') store_id?: string,
    @Query('channel') channel?: MarketingChannel,
  ) {
    const storeId = store_id ? parseInt(store_id, 10) : undefined;
    return this.marketingService.getVisibleCampaigns(storeId, channel || 'web');
  }

  @RequirePermissions('crm.view')
  @Get('campaign/:id/history')
  getCampaignHistory(@Param('id') id: string) {
    return this.marketingService.getCampaignHistory(parseInt(id, 10));
  }

  @RequirePermissions('crm.update')
  @Post('campaign/:id/rollback/:version')
  rollbackCampaign(
    @Param('id') id: string,
    @Param('version') version: string,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.marketingService.rollbackCampaign(parseInt(id, 10), parseInt(version, 10), buildMeta(user, req));
  }

  @RequirePermissions('crm.update')
  @Post('campaign/:id/pause')
  pauseCampaign(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) {
    return this.marketingService.pauseCampaign(parseInt(id, 10), buildMeta(user, req));
  }

  @RequirePermissions('crm.update')
  @Post('campaign/:id/resume')
  resumeCampaign(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) {
    return this.marketingService.resumeCampaign(parseInt(id, 10), buildMeta(user, req));
  }

  // MARKETING-003 §15 — Approval Flow
  @RequirePermissions('crm.update')
  @Post('campaign/:id/submit')
  submitForApproval(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) {
    return this.marketingService.submitForApproval(parseInt(id, 10), buildMeta(user, req));
  }

  @RequirePermissions('crm.update')
  @Post('campaign/:id/approve')
  approveCampaign(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) {
    return this.marketingService.approveCampaign(parseInt(id, 10), buildMeta(user, req));
  }

  @RequirePermissions('crm.update')
  @Post('campaign/:id/reject')
  rejectCampaign(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: any, @Req() req: any) {
    return this.marketingService.rejectCampaign(parseInt(id, 10), buildMeta(user, req), body?.reason);
  }

  @RequirePermissions('crm.update')
  @Post('campaign/:id/restore')
  restoreCampaign(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) {
    return this.marketingService.restoreCampaign(parseInt(id, 10), buildMeta(user, req));
  }

  // MARKETING-003 §16 — Multi-Branch Cloning
  @RequirePermissions('crm.create')
  @Post('campaign/:id/clone')
  cloneCampaign(
    @Param('id') id: string,
    @Body() body: { target_store_ids?: number[] | 'ALL' },
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.marketingService.cloneCampaign(parseInt(id, 10), body.target_store_ids || 'ALL', buildMeta(user, req));
  }

  // MARKETING-003 §17 — Import / Export
  @RequirePermissions('crm.view')
  @Get('campaign/export/json')
  exportJson(@Query('store_id') store_id?: string) {
    return this.marketingService.exportCampaignsJson(store_id ? Number(store_id) : undefined);
  }

  @RequirePermissions('crm.view')
  @Get('campaign/export/csv')
  async exportCsv(@Query('store_id') store_id?: string) {
    return this.marketingService.exportCampaignsCsv(store_id ? Number(store_id) : undefined);
  }

  @RequirePermissions('crm.create')
  @Post('campaign/import/json')
  importJson(@Body() body: { campaigns: any[] }, @CurrentUser() user: any, @Req() req: any) {
    return this.marketingService.importCampaignsJson(body.campaigns || [], buildMeta(user, req));
  }

  @RequirePermissions('crm.create')
  @Post('campaign/import/csv')
  importCsv(@Body() body: { csv: string }, @CurrentUser() user: any, @Req() req: any) {
    return this.marketingService.importCampaignsCsv(body.csv || '', buildMeta(user, req));
  }

  // MARKETING-002: single source the Admin Marketing Hub (and any other
  // consumer) queries to decide whether to show/hide the module entirely.
  @RequirePermissions('crm.view')
  @Get('capabilities')
  getCapabilities(@Query('store_id') store_id: string) {
    return this.marketingService.getCapabilities(Number(store_id));
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
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    if (file) body.image_url = `/uploads/${file.filename}`;
    return this.marketingService.updateCampaign(parseInt(id), body, buildMeta(user, req));
  }

  // MARKETING-003 §12: this now archives (soft delete) — campaigns are never hard-deleted.
  @RequirePermissions('crm.delete')
  @Delete('campaign/:id')
  deleteCampaign(@Param('id') id: string, @Query('reason') reason: string, @CurrentUser() user: any, @Req() req: any) {
    return this.marketingService.deleteCampaign(parseInt(id), buildMeta(user, req), reason);
  }

  @Post('analytics/:id/:event')
  trackAnalytics(@Param('id') id: string, @Param('event') event: string, @Body() body: any) {
    return this.marketingService.trackAnalytics(parseInt(id), event, body?.revenue);
  }

  @RequirePermissions('crm.view')
  @Get('kpis')
  getKPIs(
    @Query('preset') preset?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.marketingService.getKPIs({ preset, from, to });
  }

  // Single source of truth for "does this product already have an active
  // company promotion" — reused by POS/website/waiter to block manual
  // discounts/coupons/loyalty redemption on the same item.
  @RequirePermissions('crm.view')
  @Get('active-promotions')
  getActivePromotions(
    @Query('store_id') store_id: string,
    @Query('product_ids') productIds: string,
  ) {
    const ids = (productIds || '')
      .split(',')
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));
    return this.marketingService.getActivePromotions(Number(store_id), ids);
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
