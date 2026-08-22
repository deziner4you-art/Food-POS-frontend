import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { DepreciationService } from '../services/depreciation.service';
import { DepreciationPostingService } from '../services/depreciation-posting.service';
import { getSessionUserId } from '../../../../common/utils/session-context.util';

@Controller('accounting/depreciation')
export class DepreciationController {
  constructor(
    private readonly depreciationService: DepreciationService,
    private readonly postingService: DepreciationPostingService
  ) {}

  @RequirePermissions('finance.depreciation.create')
  @Post('run')
  async runDepreciation(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.depreciationService.runMonthlyDepreciation(body, userId);
  }

  @RequirePermissions('finance.depreciation.create')
  @Post('post')
  async postDepreciation(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.postingService.postDepreciation(body, userId);
  }

  @RequirePermissions('finance.depreciation.read')
  @Get('pending')
  async getPendingSchedules(@Query('store_id') storeId: string, @Query('period_end') periodEnd: string) {
    return this.depreciationService.getPendingSchedules(Number(storeId), new Date(periodEnd));
  }

  @RequirePermissions('finance.depreciation.read')
  @Get(':assetId')
  async getDepreciationHistory(@Param('assetId') assetId: string) {
    return this.depreciationService.getDepreciationHistory(Number(assetId));
  }
}
