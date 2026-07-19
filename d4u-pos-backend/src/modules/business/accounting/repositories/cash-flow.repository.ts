import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class CashFlowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCashFlowStatementDef(storeId: number) {
    return this.prisma.financialStatement.findFirst({
      where: { store_id: storeId, type: 'CASH_FLOW', is_active: true }
    });
  }

  async getCashAccounts(storeId: number) {
    // Assuming 'CASH' or 'BANK' are identifiable. We'll fetch all and filter by type or name.
    // Or we just find accounts that are assets and have 'cash' or 'bank' in name.
    return this.prisma.account.findMany({
      where: {
        store_id: storeId,
        OR: [
          { name: { contains: 'Cash' } },
          { name: { contains: 'Bank' } },
        ]
      }
    });
  }

  async getUser(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  getPrisma() {
    return this.prisma;
  }
}
