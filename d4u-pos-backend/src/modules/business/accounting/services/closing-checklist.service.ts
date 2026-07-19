import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PeriodClosingRepository } from '../repositories/period-closing.repository';
import { ClosingChecklistStatus } from '../interfaces/period-closing.interface';

@Injectable()
export class ClosingChecklistService {
  private readonly logger = new Logger(ClosingChecklistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PeriodClosingRepository,
  ) {}

  async validateAccounting(storeId: number, periodId: number): Promise<ClosingChecklistStatus> {
    const period = await this.prisma.accountingPeriod.findUnique({ where: { id: periodId } });
    if (!period) return { module: 'ACCOUNTING', status: 'FAILED', validation_message: 'Period missing' };

    // Check draft vouchers
    const draftVouchers = await this.prisma.voucher.count({
      where: { store_id: storeId, status: 'DRAFT', date: { gte: period.start_date, lte: period.end_date } }
    });

    if (draftVouchers > 0) return { module: 'ACCOUNTING', status: 'FAILED', validation_message: `${draftVouchers} draft vouchers found.` };

    return { module: 'ACCOUNTING', status: 'PASSED' };
  }

  async validateInventory(storeId: number, periodId: number): Promise<ClosingChecklistStatus> {
    const period = await this.prisma.accountingPeriod.findUnique({ where: { id: periodId } });
    if (!period) return { module: 'INVENTORY', status: 'FAILED', validation_message: 'Period missing' };

    // Pending stock counts, wastes, reservations
    const pendingTransfers = await this.prisma.warehouseTransfer.count({
      where: { OR: [{ source_store_id: storeId }, { dest_store_id: storeId }], status: 'IN_TRANSIT', created_at: { gte: period.start_date, lte: period.end_date } }
    });

    if (pendingTransfers > 0) return { module: 'INVENTORY', status: 'FAILED', validation_message: `${pendingTransfers} pending warehouse transfers.` };

    return { module: 'INVENTORY', status: 'PASSED' };
  }

  async validateProduction(storeId: number, periodId: number): Promise<ClosingChecklistStatus> {
    const period = await this.prisma.accountingPeriod.findUnique({ where: { id: periodId } });
    if (!period) return { module: 'PRODUCTION', status: 'FAILED', validation_message: 'Period missing' };

    const activeProductions = await this.prisma.productionOrder.count({
      where: { store_id: storeId, status: { in: ['DRAFT', 'RELEASED', 'IN_PRODUCTION'] }, created_at: { gte: period.start_date, lte: period.end_date } }
    });

    if (activeProductions > 0) return { module: 'PRODUCTION', status: 'FAILED', validation_message: `${activeProductions} pending production orders.` };

    return { module: 'PRODUCTION', status: 'PASSED' };
  }

  async runAllValidations(closingId: number, storeId: number, periodId: number, userId: number): Promise<boolean> {
    const results = await Promise.all([
      this.validateAccounting(storeId, periodId),
      this.validateInventory(storeId, periodId),
      this.validateProduction(storeId, periodId),
    ]);

    let allPassed = true;
    for (const res of results) {
      await this.repository.upsertChecklist(closingId, res.module, res.status, res.validation_message || '', userId);
      if (res.status === 'FAILED') allPassed = false;
    }

    return allPassed;
  }
}
