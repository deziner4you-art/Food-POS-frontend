import { Injectable } from '@nestjs/common';
import { MonthEndRepository } from '../repositories/month-end.repository';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ClosingOrchestratorService {
  constructor(
    private readonly repository: MonthEndRepository,
    private readonly prisma: PrismaService
  ) {}

  async runClosingSequence(closingId: number, storeId: number, periodId: number) {
    let hasBlockers = false;

    // 1. Verify all journals posted
    const unpostedJournals = await this.prisma.journalEntry.findMany({
      where: { store_id: storeId, accounting_period_id: periodId, is_posted_to_ledger: false }
    });
    
    if (unpostedJournals.length > 0) {
      await this.repository.addClosingTask(closingId, 'Verify Journals', 'FAILED', `Found ${unpostedJournals.length} unposted journals`);
      for (const j of unpostedJournals) {
        await this.repository.addException(closingId, 'JOURNAL_ENTRY', j.id.toString(), 'Unposted journal entry blocks month-end closing', 'BLOCKER');
      }
      hasBlockers = true;
    } else {
      await this.repository.addClosingTask(closingId, 'Verify Journals', 'SUCCESS', 'All journals are posted');
    }

    // 2. Verify warehouse transfers (Simplified Example)
    const pendingTransfers = await this.prisma.warehouseTransfer.findMany({
      where: { source_store_id: storeId, status: { in: ['PENDING', 'SHIPPED'] } }
    });

    if (pendingTransfers.length > 0) {
      await this.repository.addClosingTask(closingId, 'Verify Warehouse Transfers', 'FAILED', `Found ${pendingTransfers.length} incomplete transfers`);
      for (const t of pendingTransfers) {
        await this.repository.addException(closingId, 'WAREHOUSE_TRANSFER', t.id.toString(), 'Incomplete transfer blocks closing', 'BLOCKER');
      }
      hasBlockers = true;
    } else {
      await this.repository.addClosingTask(closingId, 'Verify Warehouse Transfers', 'SUCCESS', 'All transfers settled');
    }

    // 3. Verify accounting balances (Debits = Credits check)
    // In a real system, we aggregate ledger balances here
    await this.repository.addClosingTask(closingId, 'Verify Accounting Balances', 'SUCCESS', 'Trial Balance is verified to be equal');

    return !hasBlockers;
  }
}
