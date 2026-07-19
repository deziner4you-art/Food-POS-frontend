import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FiscalYearRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, startDate: Date, endDate: Date) {
    return this.prisma.fiscalYear.create({
      data: {
        store_id: storeId,
        start_date: startDate,
        end_date: endDate,
        is_closed: false,
      },
    });
  }

  async findActive(storeId: number) {
    return this.prisma.fiscalYear.findFirst({
      where: { store_id: storeId, is_closed: false },
    });
  }

  async findOverlapping(storeId: number, startDate: Date, endDate: Date, excludeId?: number) {
    return this.prisma.fiscalYear.findFirst({
      where: {
        store_id: storeId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
          { start_date: { lte: endDate }, end_date: { gte: startDate } },
        ],
      },
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.fiscalYear.findFirst({
      where: { id, store_id: storeId },
      include: { accounting_periods: true },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.fiscalYear.findMany({
      where: { store_id: storeId },
      orderBy: { start_date: 'desc' },
    });
  }

  async update(id: number, storeId: number, data: any) {
    return this.prisma.fiscalYear.updateMany({
      where: { id, store_id: storeId },
      data,
    });
  }
}
