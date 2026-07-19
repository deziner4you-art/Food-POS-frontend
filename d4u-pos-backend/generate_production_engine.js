const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/production-order-created.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class ProductionOrderCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'PRODUCTION_ORDER_CREATED';
  occurred_at = new Date();
  entity_type = 'PRODUCTION_ORDER';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/production-started.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class ProductionStartedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'PRODUCTION_STARTED';
  occurred_at = new Date();
  entity_type = 'PRODUCTION_ORDER';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/production-completed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class ProductionCompletedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'PRODUCTION_COMPLETED';
  occurred_at = new Date();
  entity_type = 'PRODUCTION_ORDER';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/finished-goods-created.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FinishedGoodsCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FINISHED_GOODS_CREATED';
  occurred_at = new Date();
  entity_type = 'PRODUCTION_OUTPUT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/production-order.interface.ts': `export interface CreateProductionOrderDto {
  production_number: string;
  production_type: 'KITCHEN_PRODUCTION' | 'CENTRAL_KITCHEN' | 'SEMI_FINISHED' | 'FINISHED' | 'REWORK';
  target_product_id: number;
  store_id: number;
  warehouse_id?: number;
  kitchen_id?: number;
  planned_quantity: number;
  remarks?: string;
  created_by: number;
}
`,

  'interfaces/production-result.interface.ts': `export interface ProductionResult {
  production_id: number;
  production_number: string;
  status: string;
  produced_quantity: number;
  total_cost: number;
}
`,

  // Repository
  'repositories/production.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ProductionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(data: any) {
    return this.prisma.productionOrder.create({ data });
  }

  async getOrder(id: number) {
    return this.prisma.productionOrder.findUnique({
      where: { id },
      include: { lines: true, consumptions: true, outputs: true, target_product: true }
    });
  }

  async updateOrderStatus(id: number, status: string, data: any = {}) {
    return this.prisma.productionOrder.update({ where: { id }, data: { status, ...data } });
  }

  async addLine(data: any) {
    return this.prisma.productionOrderLine.create({ data });
  }

  async addConsumption(data: any) {
    return this.prisma.productionConsumption.create({ data });
  }

  async addOutput(data: any) {
    return this.prisma.productionOutput.create({ data });
  }

  async updateLineQuantities(lineId: number, data: any) {
    return this.prisma.productionOrderLine.update({ where: { id: lineId }, data });
  }
}
`,

  // Validator
  'validators/production.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { InventoryLedgerService } from '../services/inventory-ledger.service';

@Injectable()
export class ProductionValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  async validateNewOrder(productionNumber: string, targetProductId: number) {
    const existing = await this.prisma.productionOrder.findUnique({
      where: { production_number: productionNumber }
    });

    if (existing) {
      throw new BadRequestException(\`Duplicate production number (\${productionNumber}) prohibited.\`);
    }

    const product = await this.prisma.product.findUnique({ where: { id: targetProductId }, include: { recipeItems: true } });
    if (!product || product.recipeItems.length === 0) {
      throw new BadRequestException('Target product must have a valid recipe configured.');
    }

    return product;
  }

  async validateConsumption(storeId: number, productId: number, quantity: number, warehouseId?: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Consumption quantity must be positive.');
    }

    const balanceResult = await this.ledgerService.getCurrentBalance(storeId, productId);
    if (balanceResult.current_balance < quantity) {
      throw new BadRequestException(\`Insufficient available stock for production consumption. Available: \${balanceResult.current_balance}, Requested: \${quantity}\`);
    }
  }

  async validateCompletion(producedQuantity: number) {
    if (producedQuantity < 0) {
      throw new BadRequestException('Cannot produce negative quantity.');
    }
  }
}
`,

  // Services
  'services/production-order.service.ts': `import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductionRepository } from '../repositories/production.repository';
import { ProductionValidator } from '../validators/production.validator';
import { CreateProductionOrderDto } from '../interfaces/production-order.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { ProductionOrderCreatedEvent } from '../events/production-order-created.event';
import { InventoryReservationService } from './inventory-reservation.service';
import { ReservationAllocationService } from './reservation-allocation.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ProductionOrderService {
  private readonly logger = new Logger(ProductionOrderService.name);

  constructor(
    private readonly repository: ProductionRepository,
    private readonly validator: ProductionValidator,
    private readonly eventBus: DomainEventBusService,
    private readonly reservationService: InventoryReservationService,
    private readonly allocationService: ReservationAllocationService,
  ) {}

  async createOrder(dto: CreateProductionOrderDto) {
    const product = await this.validator.validateNewOrder(dto.production_number, dto.target_product_id);

    // Create Reservation
    const reservationNumber = \`RES-PROD-\${dto.production_number}\`;
    const reservation = await this.reservationService.createDraft({
      reservation_number: reservationNumber,
      source: 'MANUAL',
      reference_module: 'PRODUCTION_ORDER',
      reference_id: dto.production_number,
      store_id: dto.store_id,
      warehouse_id: dto.warehouse_id,
      created_by: dto.created_by,
    });

    const order = await this.repository.createOrder({
      production_number: dto.production_number,
      production_type: dto.production_type,
      target_product_id: dto.target_product_id,
      store_id: dto.store_id,
      warehouse_id: dto.warehouse_id,
      kitchen_id: dto.kitchen_id,
      planned_quantity: dto.planned_quantity,
      remarks: dto.remarks,
      created_by: dto.created_by,
      status: 'DRAFT',
      reservation_id: reservation.id,
    });

    // Extract recipe and reserve
    for (const recipeItem of product.recipeItems) {
      const requiredQty = recipeItem.quantity * dto.planned_quantity;
      await this.repository.addLine({
        production_id: order.id,
        product_id: recipeItem.inventoryItemId,
        planned_quantity: requiredQty,
      });

      await this.reservationService.addLine(reservation.id, {
        product_id: recipeItem.inventoryItemId,
        reserved_quantity: requiredQty,
      });
    }

    await this.allocationService.reserve(reservation.id, dto.created_by);

    await this.repository.updateOrderStatus(order.id, 'RELEASED');
    this.eventBus.publish(new ProductionOrderCreatedEvent(dto.store_id, 0, dto.created_by, order.id.toString(), 'createProductionOrder', order));

    return order;
  }
}
`,

  'services/production-execution.service.ts': `import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductionRepository } from '../repositories/production.repository';
import { ProductionValidator } from '../validators/production.validator';
import { ProductionResult } from '../interfaces/production-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { ProductionStartedEvent } from '../events/production-started.event';
import { ProductionCompletedEvent } from '../events/production-completed.event';
import { ProductionConsumptionService } from './production-consumption.service';
import { ProductionOutputService } from './production-output.service';

@Injectable()
export class ProductionExecutionService {
  private readonly logger = new Logger(ProductionExecutionService.name);

  constructor(
    private readonly repository: ProductionRepository,
    private readonly validator: ProductionValidator,
    private readonly consumptionService: ProductionConsumptionService,
    private readonly outputService: ProductionOutputService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async startProduction(orderId: number, supervisorId: number) {
    const order = await this.repository.getOrder(orderId);
    if (!order || order.status !== 'RELEASED') {
      throw new BadRequestException('Production order must be RELEASED to start.');
    }

    await this.repository.updateOrderStatus(orderId, 'IN_PRODUCTION', { start_time: new Date(), supervisor_id: supervisorId });
    this.eventBus.publish(new ProductionStartedEvent(order.store_id, 0, supervisorId, order.id.toString(), 'startProduction', {}));
  }

  async completeProduction(orderId: number, producedQuantity: number, supervisorId: number): Promise<ProductionResult> {
    const order = await this.repository.getOrder(orderId);
    if (!order || order.status !== 'IN_PRODUCTION') {
      throw new BadRequestException('Production order must be IN_PRODUCTION to complete.');
    }

    await this.validator.validateCompletion(producedQuantity);

    // Process Consumptions automatically based on BOM (Simplified. In advanced implementations, this can be manual per batch)
    let totalCost = 0;
    for (const line of order.lines) {
      // Calculate scaled consumption based on actual produced vs planned, or just consume planned if full completion.
      const factor = producedQuantity / order.planned_quantity;
      const consumedQty = line.planned_quantity * factor;
      
      const cost = await this.consumptionService.consumeLine(order, line, consumedQty, supervisorId);
      totalCost += cost;
    }

    // Process Output (Finished Goods)
    if (producedQuantity > 0) {
      await this.outputService.produceFinishedGoods(order, producedQuantity, totalCost, supervisorId);
    }

    await this.repository.updateOrderStatus(orderId, 'COMPLETED', { end_time: new Date(), produced_quantity: producedQuantity });

    const result: ProductionResult = {
      production_id: order.id,
      production_number: order.production_number,
      status: 'COMPLETED',
      produced_quantity: producedQuantity,
      total_cost: totalCost,
    };

    this.eventBus.publish(new ProductionCompletedEvent(order.store_id, 0, supervisorId, order.id.toString(), 'completeProduction', result));
    
    return result;
  }
}
`,

  'services/production-consumption.service.ts': `import { Injectable, Logger } from '@nestjs/common';
import { ProductionRepository } from '../repositories/production.repository';
import { ReservationAllocationService } from './reservation-allocation.service';
import { InventoryValuationService } from './inventory-valuation.service';
import { AccountingIntegrationService } from './accounting-integration.service';
import { BusinessModule } from '../enums/business-module.enum';
import { BusinessEvent } from '../enums/business-event.enum';

@Injectable()
export class ProductionConsumptionService {
  private readonly logger = new Logger(ProductionConsumptionService.name);

  constructor(
    private readonly repository: ProductionRepository,
    private readonly allocationService: ReservationAllocationService,
    private readonly valuationService: InventoryValuationService,
    private readonly accountingIntegration: AccountingIntegrationService,
  ) {}

  async consumeLine(order: any, line: any, quantityToConsume: number, userId: number): Promise<number> {
    if (quantityToConsume <= 0) return 0;

    // 1. Consume from Reservation (which automatically impacts Ledger OUT)
    if (order.reservation_id) {
      await this.allocationService.consume(order.reservation_id, quantityToConsume, line.product_id, userId);
    }

    // 2. Valuation
    const valuation = await this.valuationService.calculateCost({
      store_id: order.store_id,
      warehouse_id: order.warehouse_id || 0,
      product_id: line.product_id,
      movement_type: 'PRODUCTION',
      quantity: quantityToConsume,
      transaction_date: new Date(),
      method: 'WEIGHTED_AVERAGE',
    }, userId);

    // 3. Record internal consumption
    await this.repository.addConsumption({
      production_id: order.id,
      product_id: line.product_id,
      quantity: quantityToConsume,
      unit_cost: valuation.unit_cost,
      total_cost: valuation.total_cost,
    });

    await this.repository.updateLineQuantities(line.id, {
      consumed_quantity: { increment: quantityToConsume }
    });

    // 4. Accounting Integration
    await this.accountingIntegration.processBusinessEvent({
      tenant_id: 0,
      store_id: order.store_id,
      business_module: BusinessModule.INVENTORY,
      business_event: 'PRODUCTION_CONSUMPTION' as any, // Mapped locally
      business_document_id: order.production_number,
      document_number: order.production_number,
      transaction_date: new Date(),
      user_id: userId,
      reference: \`Production Consumption: \${order.production_number}\`,
      amount: valuation.total_cost,
    });

    return valuation.total_cost;
  }
}
`,

  'services/production-output.service.ts': `import { Injectable, Logger } from '@nestjs/common';
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
    const batchNumber = \`PRD-\${order.production_number}\`;
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
      supplier_id: undefined,
      purchase_order_id: undefined,
    }, userId);

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
      reference: \`Production Output: \${order.production_number}\`,
      amount: totalCost,
    });

    this.eventBus.publish(new FinishedGoodsCreatedEvent(order.store_id, 0, userId, batch.id.toString(), 'produceGoods', { batchNumber, quantity }));
  }
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
