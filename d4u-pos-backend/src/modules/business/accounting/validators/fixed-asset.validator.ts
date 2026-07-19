import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateFixedAssetInput } from '../interfaces/fixed-asset.interface';
import { TransferAssetInput } from '../interfaces/asset-transfer.interface';
import { DisposeAssetInput } from '../interfaces/asset-disposal.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FixedAssetValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateCreation(input: CreateFixedAssetInput) {
    if (!input.code || !input.name) throw new BadRequestException('Asset code and name are required');
    if (input.purchase_cost <= 0) throw new BadRequestException('Purchase cost must be > 0');
    if (input.useful_life <= 0) throw new BadRequestException('Useful life must be > 0');
    if (input.residual_value > input.purchase_cost) throw new BadRequestException('Residual value cannot exceed purchase cost');
    
    const existing = await this.prisma.fixedAsset.findUnique({ where: { code: input.code } });
    if (existing) throw new BadRequestException('Asset code must be unique');

    const category = await this.prisma.fixedAssetCategory.findUnique({ where: { id: input.category_id } });
    if (!category) throw new BadRequestException('Invalid asset category');

    if (input.location_id) {
      const location = await this.prisma.assetLocation.findUnique({ where: { id: input.location_id, store_id: input.store_id } });
      if (!location) throw new BadRequestException('Invalid asset location');
    }
  }

  validateTransfer(asset: any, input: TransferAssetInput) {
    if (!asset) throw new BadRequestException('Asset not found');
    if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
      throw new BadRequestException('Disposed assets cannot be transferred');
    }
    if (asset.location_id === input.to_location_id) {
      throw new BadRequestException('Asset is already at the target location');
    }
  }

  validateDisposal(asset: any, input: DisposeAssetInput) {
    if (!asset) throw new BadRequestException('Asset not found');
    if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
      throw new BadRequestException('Asset is already disposed');
    }
    if (input.disposal_type === 'SALE' && (input.sale_value === undefined || input.sale_value < 0)) {
      throw new BadRequestException('Sale value is required and cannot be negative for SALE type');
    }
  }
}
