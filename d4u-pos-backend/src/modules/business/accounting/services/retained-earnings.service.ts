import { Injectable } from '@nestjs/common';
import { YearEndClosingRepository } from '../repositories/year-end-closing.repository';
import { RetainedEarningsTransferResult } from '../interfaces/retained-earnings.interface';
import { TrialBalanceService } from './trial-balance.service';

import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class RetainedEarningsService {
  constructor(
    private readonly repository: YearEndClosingRepository,
    private readonly tbService: TrialBalanceService,
    private readonly prisma: PrismaService
  ) {}

  async transferProfitLoss(storeId: number, fiscalYearId: number, retainedEarningsAccountId: number, closingId: number, userId: number): Promise<RetainedEarningsTransferResult> {
    // Generate TB to figure out net profit/loss
    // In reality we would call Profit & Loss engine, but TB handles it implicitly via root types
    
    // For blueprint: mock calculation based on a static amount or real TB
    // Since we don't have real live data inserted, we assume a static 0 variance or we simulate
    const currentFy = await this.prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
    if (!currentFy) throw new Error('Fiscal year not found');

    const tbResult = await this.tbService.generateTrialBalance({
      store_id: storeId,
      fiscal_year_id: fiscalYearId,
      start_date: currentFy.start_date,
      end_date: currentFy.end_date
    }, userId);

    const accounts = await this.prisma.account.findMany({
      where: { store_id: storeId },
      include: { account_group: true }
    });
    const accMap = new Map(accounts.map(a => [a.id, a.account_group.root_type]));

    let totalRevenue = 0;
    let totalExpense = 0;

    for (const line of tbResult.lines) {
      const rootType = accMap.get(line.account_id);
      if (rootType === 'REVENUE') totalRevenue += Number(line.closing_credit) - Number(line.closing_debit);
      if (rootType === 'EXPENSE') totalExpense += Number(line.closing_debit) - Number(line.closing_credit);
    }

    const netAmount = totalRevenue - totalExpense;
    const type = netAmount >= 0 ? 'PROFIT' : 'LOSS';
    const amountAbs = Math.abs(netAmount);

    await this.repository.recordTransfer(closingId, retainedEarningsAccountId, amountAbs, type);
    await this.repository.addLog(closingId, 'Transfer to Retained Earnings', 'SUCCESS', `Transferred ${amountAbs} ${type}`);

    return { amount: amountAbs, transfer_type: type };
  }
}
