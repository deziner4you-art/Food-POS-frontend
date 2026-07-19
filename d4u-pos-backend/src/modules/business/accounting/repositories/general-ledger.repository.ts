import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GeneralLedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(storeId: number, data: any[]) {
    // We do one by one to easily maintain running balance per account,
    // Or normally we'd compute running balance and then use createMany.
    // Assuming calculation happens in service before calling this.
    return this.prisma.generalLedger.createMany({
      data: data.map(d => ({ ...d, store_id: storeId })),
    });
  }

  async findByQuery(storeId: number, query: any) {
    const where: Prisma.GeneralLedgerWhereInput = { store_id: storeId };
    
    if (query.account_id) where.account_id = query.account_id;
    if (query.fiscal_year_id) where.fiscal_year_id = query.fiscal_year_id;
    if (query.accounting_period_id) where.accounting_period_id = query.accounting_period_id;
    if (query.reference) where.reference = query.reference;
    if (query.start_date || query.end_date) {
      where.posting_date = {};
      if (query.start_date) where.posting_date.gte = new Date(query.start_date);
      if (query.end_date) where.posting_date.lte = new Date(query.end_date);
    }
    // Cannot easily query journal_id directly unless we join, 
    // but we have journal_entry relation so we can filter by it
    if (query.journal_id) {
      where.journal_entry = { journal_id: query.journal_id };
    }

    return this.prisma.generalLedger.findMany({
      where,
      orderBy: [
        { posting_date: 'asc' },
        { created_at: 'asc' },
      ],
      include: {
        account: true,
        journal_entry: true,
      },
    });
  }

  async getLatestEntryForAccount(storeId: number, accountId: number) {
    return this.prisma.generalLedger.findFirst({
      where: { store_id: storeId, account_id: accountId },
      orderBy: [
        { posting_date: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }
}
