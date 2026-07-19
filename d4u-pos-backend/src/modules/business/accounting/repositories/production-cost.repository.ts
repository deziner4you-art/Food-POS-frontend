import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ProductionCostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateCost(productionId: number, data: any) {
    return this.prisma.productionCost.upsert({
      where: { production_id: productionId },
      update: data,
      create: { production_id: productionId, ...data }
    });
  }

  async createOrUpdateVariance(productionId: number, data: any) {
    return this.prisma.productionVariance.upsert({
      where: { production_id: productionId },
      update: data,
      create: { production_id: productionId, ...data }
    });
  }

  async createOrUpdateYield(productionId: number, data: any) {
    return this.prisma.productionYield.upsert({
      where: { production_id: productionId },
      update: data,
      create: { production_id: productionId, ...data }
    });
  }
}
