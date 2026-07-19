import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class BalanceSheetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBalanceSheetStatementDef(storeId: number) {
    return this.prisma.financialStatement.findFirst({
      where: { store_id: storeId, type: 'BALANCE_SHEET', is_active: true }
    });
  }

  async getFiscalYear(fiscalYearId: number) {
    return this.prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
  }

  async getUser(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
