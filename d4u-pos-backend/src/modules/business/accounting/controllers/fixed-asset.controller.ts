import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { FixedAssetService } from '../services/fixed-asset.service';
import { AssetTransferService } from '../services/asset-transfer.service';
import { AssetDisposalService } from '../services/asset-disposal.service';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/fixed-assets')
export class FixedAssetController {
  constructor(
    private readonly assetService: FixedAssetService,
    private readonly transferService: AssetTransferService,
    private readonly disposalService: AssetDisposalService
  ) {}

  @Post()
  async createAsset(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.assetService.createAsset(body, userId);
  }

  @Get()
  async getAssets(@Query('store_id') storeId: string) {
    return this.assetService.getAssets(Number(storeId));
  }

  @Get(':id')
  async getAssetById(@Param('id') id: string) {
    return this.assetService.getAssetById(Number(id));
  }

  @Patch(':id')
  async updateAsset(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.assetService.updateAsset(Number(id), body, userId);
  }

  @Post('transfer')
  async transferAsset(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.transferService.transferAsset(body, userId);
  }

  @Post('dispose')
  async disposeAsset(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.disposalService.disposeAsset(body, userId);
  }
}
