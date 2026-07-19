import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class YearEndClosingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createClosingSession(storeId: number, fiscalYearId: number, userId: number) {
    return this.prisma.yearEndClosing.upsert({
      where: { fiscal_year_id: fiscalYearId },
      update: {
        status: 'IN_PROGRESS',
        started_at: new Date(),
        executed_by: userId,
        logs: { deleteMany: {} },
        transfers: { deleteMany: {} }
      },
      create: {
        store_id: storeId,
        fiscal_year_id: fiscalYearId,
        status: 'IN_PROGRESS',
        started_at: new Date(),
        executed_by: userId
      }
    });
  }

  async addLog(closingId: number, name: string, status: string, message?: string) {
    return this.prisma.yearEndClosingLog.create({
      data: {
        year_end_closing_id: closingId,
        task_name: name,
        status,
        message,
        executed_at: new Date()
      }
    });
  }

  async recordTransfer(closingId: number, retainedEarningsAccountId: number, amount: number, type: string) {
    return this.prisma.retainedEarningsTransfer.create({
      data: {
        year_end_closing_id: closingId,
        retained_earnings_account_id: retainedEarningsAccountId,
        amount,
        transfer_type: type
      }
    });
  }

  async completeClosing(closingId: number, status: string) {
    return this.prisma.yearEndClosing.update({
      where: { id: closingId },
      data: { status, completed_at: new Date() }
    });
  }
}
