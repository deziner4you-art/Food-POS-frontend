import { Injectable, Logger } from '@nestjs/common';
import { ProductionRepository } from '../repositories/production.repository';
import { InventoryLedgerService } from './inventory-ledger.service';
import { BatchManagementService } from './batch-management.service';
import { AccountingIntegrationService } from './accounting-integration.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FinishedGoodsCreatedEvent } from '../events/finished-goods-created.event';
import { BusinessModule } from '../enums/business-module.enum';
import { BusinessEvent } from '../enums/business-event.enum';

@Injectable()
export class ProductionOutputService {
  private readonly logger = new Logger(ProductionOutputService.name);

  constructor(
    private readonly repository: ProductionRepository,
    private readonly ledgerService: InventoryLedgerService,
    private readonly batchService: BatchManagementService,
    private readonly accountingIntegration: AccountingIntegrationService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async produceFinishedGoods(order: any, quantity: number, totalCost: number, userId: number) {
    const unitCost = quantity > 0 ? totalCost / quantity : 0;
    
    // We assume the target_product is mapped to an InventoryItem as well.
    // If it's a finished good sold at POS, it must be available in inventory.
    // We will use target_product_id directly mapping to an InventoryItem.
    // Typically POS Products and Inventory Items are distinct, but here we expect a matching Inventory Item.
    // For simplicity, we just use the ID if they share the same sequence, or assume the product exists in InventoryItem.

    // 1. Create a new Batch for traceability
    const batchNumber = `PRD-${order.production_number}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Default 30 days expiry for produced goods

    const batch = await this.batchService.createBatch({
      batch_number: batchNumber,
      lot_number: order.production_number,
      store_id: order.store_id,
      warehouse_id: order.warehouse_id || undefined,
      product_id: order.target_product_id, // Target product ID should map to Inventory Item ID
      received_quantity: quantity,
      unit_cost: unitCost,
      manufacturing_date: new Date(),
      expiry_date: expiryDate,
      created_by: userId,
    });

    // 2. Record Output
    await this.repository.addOutput({
      production_id: order.id,
      product_id: order.target_product_id,
      batch_id: batch.id,
      quantity: quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
    });

    // 3. Ledger IN
    await this.ledgerService.recordMovement({
      store_id: order.store_id,
      warehouse_id: order.warehouse_id || undefined,
      product_id: order.target_product_id,
      batch_number: batchNumber,
      movement_type: 'PRODUCTION',
      reference_module: 'PRODUCTION_ORDER',
      reference_id: order.id.toString(),
      quantity_in: quantity,
      quantity_out: 0,
      unit_cost: unitCost,
      total_cost: totalCost,
      created_by: userId,
      transaction_date: new Date(),
    });

    // 4. Accounting Integration
    await this.accountingIntegration.processBusinessEvent({
      tenant_id: 0,
      store_id: order.store_id,
      business_module: BusinessModule.INVENTORY,
      business_event: 'PRODUCTION_OUTPUT' as any,
      business_document_id: order.production_number,
      document_number: order.production_number,
      transaction_date: new Date(),
      user_id: userId,
      reference: `Production Output: ${order.production_number}`,
      amount: totalCost,
    });

    this.eventBus.publish(new FinishedGoodsCreatedEvent(order.store_id, 0, userId, batch.id.toString(), 'produceGoods', { batchNumber, quantity }));
  }
}
