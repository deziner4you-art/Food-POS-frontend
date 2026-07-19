import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class DepreciationValidator {
  constructor(private readonly prisma: PrismaService) {}

  validateAssetEligibility(asset: any) {
    if (asset.status !== 'ACTIVE') throw new BadRequestException(`Asset ${asset.code} is not ACTIVE`);
    if (!asset.capitalization_date) throw new BadRequestException(`Asset ${asset.code} is not capitalized`);
    if (asset.useful_life <= 0) throw new BadRequestException(`Asset ${asset.code} has invalid useful life`);
    if (Number(asset.purchase_cost) <= Number(asset.residual_value)) throw new BadRequestException(`Asset ${asset.code} residual value exceeds or equals purchase cost`);
  }

  validatePosting(schedule: any) {
    if (!schedule) throw new BadRequestException('Schedule not found');
    if (schedule.is_posted) throw new BadRequestException('Schedule is already posted');
    if (schedule.asset_depreciation.asset.status === 'DISPOSED' || schedule.asset_depreciation.asset.status === 'WRITTEN_OFF') {
      throw new BadRequestException('Cannot post depreciation for a disposed asset');
    }
  }
}
