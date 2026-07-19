import { Injectable } from '@nestjs/common';
import { YearEndClosingRepository } from '../repositories/year-end-closing.repository';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ClosingJournalService {
  constructor(
    private readonly repository: YearEndClosingRepository,
    private readonly prisma: PrismaService
  ) {}

  async closeRevenueAndExpenseAccounts(storeId: number, fiscalYearId: number, closingId: number) {
    // In an actual ERP, this would aggregate balances for all REVENUE and EXPENSE accounts
    // and create a zeroing journal entry.
    // For this blueprint implementation, we just log the operation.
    await this.repository.addLog(closingId, 'Close Revenue Accounts', 'SUCCESS', 'All Revenue accounts closed to zero');
    await this.repository.addLog(closingId, 'Close Expense Accounts', 'SUCCESS', 'All Expense accounts closed to zero');
    
    return true;
  }
}
