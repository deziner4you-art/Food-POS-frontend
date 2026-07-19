import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class PeriodLockService {
  constructor(private readonly prisma: PrismaService) {}

  async validatePostingPeriod(storeId: number, transactionDate: Date) {
    // Find the period matching this date
    const period = await this.prisma.accountingPeriod.findFirst({
      where: {
        store_id: storeId,
        start_date: { lte: transactionDate },
        end_date: { gte: transactionDate }
      }
    });

    if (!period) {
      throw new BadRequestException('Transaction date does not fall into any configured accounting period.');
    }

    // Check period closing lock status
    const closing = await this.prisma.periodClosing.findUnique({
      where: { accounting_period_id: period.id }
    });

    if (closing) {
      if (closing.status === 'CLOSED' || closing.status === 'LOCKED') {
        throw new BadRequestException(`Cannot post transaction. Accounting period '${period.month}-${period.year}' is ${closing.status}.`);
      }
    }

    return period;
  }

  async lockPeriod(periodId: number, userId: number, reason: string) {
    const period = await this.prisma.accountingPeriod.findUnique({
      where: { id: periodId }
    });
    if (!period) throw new BadRequestException('Invalid accounting period');

    return this.prisma.periodClosing.upsert({
      where: { accounting_period_id: periodId },
      update: { status: 'LOCKED', closed_by: userId, closed_at: new Date() },
      create: {
        store_id: period.store_id,
        fiscal_year_id: period.fiscal_year_id,
        accounting_period_id: periodId,
        status: 'LOCKED',
        closed_by: userId,
        closed_at: new Date()
      }
    });
  }

  async unlockPeriod(periodId: number, userId: number, reason: string) {
    return this.prisma.periodClosing.update({
      where: { accounting_period_id: periodId },
      data: { status: 'OPEN' }
    });
  }
}
