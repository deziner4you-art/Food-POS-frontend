import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@Injectable()
export class AccountingPeriodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(periods: any[]) {
    return this.prisma.accountingPeriod.createMany({
      data: periods,
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.accountingPeriod.findFirst({
      where: { id, store_id: storeId },
    });
  }

  async findAllByFiscalYear(storeId: number, fiscalYearId: number) {
    return this.prisma.accountingPeriod.findMany({
      where: { store_id: storeId, fiscal_year_id: fiscalYearId },
      orderBy: { start_date: 'asc' },
    });
  }

  async countOpenPeriods(storeId: number, fiscalYearId: number) {
    return this.prisma.accountingPeriod.count({
      where: { store_id: storeId, fiscal_year_id: fiscalYearId, status: AccountingPeriodStatus.OPEN },
    });
  }

  async updateStatus(id: number, storeId: number, status: AccountingPeriodStatus) {
    return this.prisma.accountingPeriod.updateMany({
      where: { id, store_id: storeId },
      data: { status },
    });
  }
}
