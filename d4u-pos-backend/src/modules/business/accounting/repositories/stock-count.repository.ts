import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class StockCountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(data: any) {
    return this.prisma.stockCountSession.create({ data });
  }

  async getSession(id: number) {
    return this.prisma.stockCountSession.findUnique({
      where: { id },
      include: { lines: true }
    });
  }

  async updateSessionStatus(id: number, status: string, approvedBy?: number) {
    const data: any = { status };
    if (approvedBy) data.approved_by = approvedBy;
    if (status === 'RECONCILED' || status === 'REVIEW') data.completed_at = new Date();

    return this.prisma.stockCountSession.update({
      where: { id },
      data,
    });
  }

  async createOrUpdateLine(sessionId: number, productId: number, systemQuantity: number, physicalQuantity: number, unitCost: number, variance: number, remarks?: string) {
    const existing = await this.prisma.stockCountLine.findFirst({
      where: { session_id: sessionId, product_id: productId }
    });

    if (existing) {
      return this.prisma.stockCountLine.update({
        where: { id: existing.id },
        data: { physical_quantity: physicalQuantity, variance, remarks }
      });
    }

    return this.prisma.stockCountLine.create({
      data: {
        session_id: sessionId,
        product_id: productId,
        system_quantity: systemQuantity,
        physical_quantity: physicalQuantity,
        variance,
        unit_cost: unitCost,
        remarks
      }
    });
  }
}
