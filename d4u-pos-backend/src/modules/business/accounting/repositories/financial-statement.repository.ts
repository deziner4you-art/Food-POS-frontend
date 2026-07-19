import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FinancialStatementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createStatement(data: any) {
    return this.prisma.financialStatement.create({ data });
  }

  async getStatementStructure(statementId: number) {
    return this.prisma.financialStatement.findUnique({
      where: { id: statementId },
      include: {
        sections: {
          include: {
            sub_sections: true,
            mappings: true
          },
          orderBy: { sort_order: 'asc' }
        }
      }
    });
  }

  async getStatementByStoreAndId(storeId: number, statementId: number) {
    return this.prisma.financialStatement.findFirst({
      where: { store_id: storeId, id: statementId }
    });
  }

  async createSection(data: any) {
    return this.prisma.financialStatementSection.create({ data });
  }

  async getSection(sectionId: number) {
    return this.prisma.financialStatementSection.findUnique({ where: { id: sectionId } });
  }

  async createMapping(data: any) {
    return this.prisma.financialStatementMapping.create({ data });
  }

  async checkDuplicateMapping(statementId: number, accountId?: number, accountGroupId?: number) {
    const filters: any[] = [];
    if (accountId) filters.push({ account_id: accountId });
    if (accountGroupId) filters.push({ account_group_id: accountGroupId });

    return this.prisma.financialStatementMapping.findFirst({
      where: {
        section: { statement_id: statementId },
        OR: filters
      }
    });
  }

  async getStoreAccounts(storeId: number) {
    return this.prisma.account.findMany({ where: { store_id: storeId } });
  }

  async getStoreAccountGroups(storeId: number) {
    return this.prisma.accountGroup.findMany({ where: { store_id: storeId } });
  }
}
