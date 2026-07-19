import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class GeneralLedgerReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOpeningBalance(storeId: number, accountId: number, startDate: Date) {
    const result = await this.prisma.generalLedger.aggregate({
      where: {
        store_id: storeId,
        account_id: accountId,
        posting_date: { lt: startDate }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });
    return result._sum;
  }

  async getLedgerLines(filter: any) {
    return this.prisma.generalLedger.findMany({
      where: filter,
      include: {
        account: true,
        journal_entry: {
          include: {
            voucher: {
              include: { voucher_type: true }
            }
          }
        },
        journal_entry_line: true
      },
      orderBy: { posting_date: 'asc' }
    });
  }

  async getTransactionDrilldown(glLineId: number) {
    return this.prisma.generalLedger.findUnique({
      where: { id: glLineId },
      include: {
        journal_entry: {
          include: {
            lines: true,
            voucher: { include: { voucher_type: true } },
          }
        }
      }
    });
  }
}
