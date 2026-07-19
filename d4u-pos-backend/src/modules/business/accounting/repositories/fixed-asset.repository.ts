import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FixedAssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAsset(data: any) {
    return this.prisma.fixedAsset.create({ data });
  }

  async getAssetById(id: number) {
    return this.prisma.fixedAsset.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        transfers: { include: { from_location: true, to_location: true } },
        disposal: true
      }
    });
  }

  async getAssetByCode(storeId: number, code: string) {
    return this.prisma.fixedAsset.findUnique({
      where: { code }
    });
  }

  async updateAsset(id: number, data: any) {
    return this.prisma.fixedAsset.update({
      where: { id },
      data
    });
  }

  async getAssets(storeId: number) {
    return this.prisma.fixedAsset.findMany({
      where: { store_id: storeId },
      include: { category: true, location: true }
    });
  }

  async recordTransfer(data: any) {
    return this.prisma.assetTransfer.create({ data });
  }

  async recordDisposal(data: any) {
    return this.prisma.assetDisposal.create({ data });
  }
}
