import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class TrialBalanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAccountBalances(storeId: number, startDate: Date, endDate: Date) {
    // We get all POSTED ledger entries grouped by account
    // For trial balance, we need opening (before startDate) and period (between start and end)
    
    // 1. Get all accounts for the store
    const accounts = await this.prisma.account.findMany({
      where: { store_id: storeId },
      include: { account_group: true },
      orderBy: { code: 'asc' }
    });

    // 2. Get Opening Balances
    const openingEntries = await this.prisma.generalLedger.groupBy({
      by: ['account_id'],
      where: {
        store_id: storeId,
        posting_date: { lt: startDate }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    // 3. Get Period Activity
    const periodEntries = await this.prisma.generalLedger.groupBy({
      by: ['account_id'],
      where: {
        store_id: storeId,
        posting_date: { gte: startDate, lte: endDate }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    return { accounts, openingEntries, periodEntries };
  }
}
