import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ProfitLossRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfitLossStatementDef(storeId: number) {
    return this.prisma.financialStatement.findFirst({
      where: { store_id: storeId, type: 'PROFIT_LOSS', is_active: true }
    });
  }

  async getUser(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
