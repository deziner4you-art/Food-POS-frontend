import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { DepreciationService } from '../services/depreciation.service';
import { DepreciationPostingService } from '../services/depreciation-posting.service';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/depreciation')
export class DepreciationController {
  constructor(
    private readonly depreciationService: DepreciationService,
    private readonly postingService: DepreciationPostingService
  ) {}

  @Post('run')
  async runDepreciation(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.depreciationService.runMonthlyDepreciation(body, userId);
  }

  @Post('post')
  async postDepreciation(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.postingService.postDepreciation(body, userId);
  }

  @Get('pending')
  async getPendingSchedules(@Query('store_id') storeId: string, @Query('period_end') periodEnd: string) {
    return this.depreciationService.getPendingSchedules(Number(storeId), new Date(periodEnd));
  }

  @Get(':assetId')
  async getDepreciationHistory(@Param('assetId') assetId: string) {
    return this.depreciationService.getDepreciationHistory(Number(assetId));
  }
}
