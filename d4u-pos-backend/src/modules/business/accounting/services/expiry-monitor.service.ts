import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { ExpiryMonitorResult } from '../interfaces/expiry.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BatchExpiredEvent } from '../events/batch-expired.event';

@Injectable()
export class ExpiryMonitorService {
  private readonly logger = new Logger(ExpiryMonitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async scanExpiries(storeId: number): Promise<ExpiryMonitorResult> {
    this.logger.log(`Scanning expiries for store ${storeId}`);
    const now = new Date();

    const result: ExpiryMonitorResult = {
      store_id: storeId,
      scan_date: now,
      expired_today: 0,
      expiring_7_days: 0,
      expiring_30_days: 0,
      already_expired: 0,
      batches_updated: 0,
    };

    const activeBatches = await this.prisma.inventoryBatch.findMany({
      where: { store_id: storeId, status: 'ACTIVE', expiry_date: { not: null } }
    });

    for (const batch of activeBatches) {
      const expiryDate = new Date(batch.expiry_date!);
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        result.expired_today++;
        await this.prisma.inventoryBatch.update({ where: { id: batch.id }, data: { status: 'EXPIRED' } });
        result.batches_updated++;
        this.eventBus.publish(new BatchExpiredEvent(storeId, 0, 0, batch.id.toString(), 'scanExpiries', batch));
      } else if (diffDays <= 7) {
        result.expiring_7_days++;
      } else if (diffDays <= 30) {
        result.expiring_30_days++;
      }
    }

    const alreadyExpired = await this.prisma.inventoryBatch.count({
      where: { store_id: storeId, status: 'EXPIRED' }
    });
    result.already_expired = alreadyExpired;

    return result;
  }
}
