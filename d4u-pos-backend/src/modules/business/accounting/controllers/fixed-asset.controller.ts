import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { FixedAssetService } from '../services/fixed-asset.service';
import { AssetTransferService } from '../services/asset-transfer.service';
import { AssetDisposalService } from '../services/asset-disposal.service';

@Controller('accounting/fixed-assets')
export class FixedAssetController {
  constructor(
    private readonly assetService: FixedAssetService,
    private readonly transferService: AssetTransferService,
    private readonly disposalService: AssetDisposalService
  ) {}

  @RequirePermissions('finance.accounting.create')
  @Post()
  async createAsset(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.assetService.createAsset(body, userId);
  }

  @RequirePermissions('finance.accounting.view')
  @Get()
  async getAssets(@Query('store_id') storeId: string) {
    return this.assetService.getAssets(Number(storeId));
  }

  @RequirePermissions('finance.accounting.view')
  @Get(':id')
  async getAssetById(@Param('id') id: string) {
    return this.assetService.getAssetById(Number(id));
  }

  @RequirePermissions('finance.accounting.update')
  @Patch(':id')
  async updateAsset(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.assetService.updateAsset(Number(id), body, userId);
  }

  @RequirePermissions('finance.accounting.create')
  @Post('transfer')
  async transferAsset(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.transferService.transferAsset(body, userId);
  }

  @RequirePermissions('finance.accounting.create')
  @Post('dispose')
  async disposeAsset(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.disposalService.disposeAsset(body, userId);
  }
}
