import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class DepreciationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveAssetsForDepreciation(storeId: number) {
    return this.prisma.fixedAsset.findMany({
      where: {
        store_id: storeId,
        status: 'ACTIVE',
        capitalization_date: { not: null }
      },
      include: { depreciation: true }
    });
  }

  async getAssetDepreciation(assetId: number) {
    return this.prisma.assetDepreciation.findUnique({
      where: { asset_id: assetId },
      include: { asset: true }
    });
  }

  async createOrUpdateAssetDepreciation(data: any) {
    return this.prisma.assetDepreciation.upsert({
      where: { asset_id: data.asset_id },
      update: {
        accumulated_amount: data.accumulated_amount,
        book_value: data.book_value,
        last_depreciation_date: data.last_depreciation_date
      },
      create: data
    });
  }

  async createSchedule(data: any) {
    return this.prisma.depreciationSchedule.create({ data });
  }

  async getPendingSchedules(storeId: number, periodEnd: Date) {
    return this.prisma.depreciationSchedule.findMany({
      where: {
        is_posted: false,
        period_end: { lte: periodEnd },
        asset_depreciation: { asset: { store_id: storeId } }
      },
      include: { asset_depreciation: { include: { asset: true } } }
    });
  }

  async getScheduleById(scheduleId: number) {
    return this.prisma.depreciationSchedule.findUnique({
      where: { id: scheduleId },
      include: { asset_depreciation: { include: { asset: true } } }
    });
  }

  async recordPosting(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const posting = await tx.depreciationPosting.create({ data });
      await tx.depreciationSchedule.update({
        where: { id: data.schedule_id },
        data: { is_posted: true }
      });
      return posting;
    });
  }

  async getDepreciationHistory(assetId: number) {
    return this.prisma.assetDepreciation.findUnique({
      where: { asset_id: assetId },
      include: { schedules: { include: { posting: true } } }
    });
  }
}
