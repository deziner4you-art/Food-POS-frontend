import { Injectable, Logger } from '@nestjs/common';
import { InventoryLedgerRepository } from '../repositories/inventory-ledger.repository';
import { InventoryLedgerValidator } from '../validators/inventory-ledger.validator';
import { RecordMovementDto } from '../interfaces/inventory-movement.interface';
import { InventoryBalanceResult } from '../interfaces/inventory-balance.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { InventoryMovementRecordedEvent } from '../events/inventory-movement-recorded.event';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class InventoryLedgerService {
  private readonly logger = new Logger(InventoryLedgerService.name);

  constructor(
    private readonly repository: InventoryLedgerRepository,
    private readonly validator: InventoryLedgerValidator,
    private readonly eventBus: DomainEventBusService,
    private readonly prisma: PrismaService, // For transactional consistency
  ) {}

  async recordMovement(dto: RecordMovementDto) {
    this.logger.log(`Recording Inventory Movement for Product ${dto.product_id}`);

    await this.validator.validateMovement(dto);

    // Get current balance strictly
    const currentBalance = await this.repository.getLatestBalance(
      dto.store_id, 
      dto.product_id, 
      dto.warehouse_id, 
      dto.batch_number
    );

    const balanceAfter = currentBalance + dto.quantity_in - dto.quantity_out;

    // Save mathematically correct, append-only ledger entry
    const movement = await this.repository.createMovement({
      ...dto,
      balance_after: balanceAfter,
    });

    // We must also update the physical cached balance on the legacy InventoryItem table
    await this.prisma.inventoryItem.update({
      where: { id: dto.product_id },
      data: {
        quantity: { increment: dto.quantity_in - dto.quantity_out }
      }
    });

    this.eventBus.publish(new InventoryMovementRecordedEvent(
      dto.store_id, 0, dto.created_by, movement.id.toString(), 'recordMovement', movement
    ));

    return movement;
  }

  async getProductLedger(storeId: number, productId: number) {
    return this.repository.getMovements(storeId, productId);
  }

  async getCurrentBalance(storeId: number, productId: number): Promise<InventoryBalanceResult> {
    const balance = await this.repository.getLatestBalance(storeId, productId);
    return {
      store_id: storeId,
      product_id: productId,
      total_in: 0, // This could be calculated via aggregation if needed
      total_out: 0,
      current_balance: balance,
      last_calculated_at: new Date(),
    };
  }

  async getBatchBalance(storeId: number, productId: number, batchNumber: string) {
    return this.repository.getLatestBalance(storeId, productId, undefined, batchNumber);
  }

  async getWarehouseBalance(storeId: number, productId: number, warehouseId: number) {
    return this.repository.getLatestBalance(storeId, productId, warehouseId);
  }
}
