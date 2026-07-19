import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ProductionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(data: any) {
    return this.prisma.productionOrder.create({ data });
  }

  async getOrder(id: number) {
    return this.prisma.productionOrder.findUnique({
      where: { id },
      include: { lines: true, consumptions: true, outputs: true, target_product: true }
    });
  }

  async updateOrderStatus(id: number, status: string, data: any = {}) {
    return this.prisma.productionOrder.update({ where: { id }, data: { status, ...data } });
  }

  async addLine(data: any) {
    return this.prisma.productionOrderLine.create({ data });
  }

  async addConsumption(data: any) {
    return this.prisma.productionConsumption.create({ data });
  }

  async addOutput(data: any) {
    return this.prisma.productionOutput.create({ data });
  }

  async updateLineQuantities(lineId: number, data: any) {
    return this.prisma.productionOrderLine.update({ where: { id: lineId }, data });
  }
}
