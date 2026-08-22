import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { FixedAssetService } from '../services/fixed-asset.service';
import { AssetTransferService } from '../services/asset-transfer.service';
import { AssetDisposalService } from '../services/asset-disposal.service';
import { getSessionUserId } from '../../../../common/utils/session-context.util';

@Controller('accounting/fixed-assets')
export class FixedAssetController {
  constructor(
    private readonly assetService: FixedAssetService,
    private readonly transferService: AssetTransferService,
    private readonly disposalService: AssetDisposalService
  ) {}

  @RequirePermissions('finance.fixed_assets.create')
  @Post()
  async createAsset(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.assetService.createAsset(body, userId);
  }

  @RequirePermissions('finance.fixed_assets.read')
  @Get()
  async getAssets(@Query('store_id') storeId: string) {
    return this.assetService.getAssets(Number(storeId));
  }

  @RequirePermissions('finance.fixed_assets.read')
  @Get(':id')
  async getAssetById(@Param('id') id: string) {
    return this.assetService.getAssetById(Number(id));
  }

  @RequirePermissions('finance.fixed_assets.update')
  @Patch(':id')
  async updateAsset(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.assetService.updateAsset(Number(id), body, userId);
  }

  @RequirePermissions('finance.fixed_assets.transfer')
  @Post('transfer')
  async transferAsset(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.transferService.transferAsset(body, userId);
  }

  @RequirePermissions('finance.fixed_assets.dispose')
  @Post('dispose')
  async disposeAsset(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.disposalService.disposeAsset(body, userId);
  }
}
