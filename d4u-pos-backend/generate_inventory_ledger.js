const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Interfaces
  'interfaces/inventory-movement.interface.ts': `export interface RecordMovementDto {
  store_id: number;
  warehouse_id?: number;
  product_id: number;
  batch_number?: string;
  movement_type: 'GOODS_RECEIPT' | 'PURCHASE_RETURN' | 'SALE_CONSUMPTION' | 'RECIPE_CONSUMPTION' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'STOCK_ADJUSTMENT' | 'WASTE' | 'SPOILAGE' | 'PRODUCTION' | 'MANUAL_ENTRY';
  reference_module: string;
  reference_id: string;
  quantity_in: number;
  quantity_out: number;
  unit_cost: number;
  total_cost: number;
  valuation_method?: string;
  created_by: number;
  transaction_date: Date;
}
`,

  'interfaces/inventory-balance.interface.ts': `export interface InventoryBalanceResult {
  store_id: number;
  warehouse_id?: number;
  product_id: number;
  batch_number?: string;
  total_in: number;
  total_out: number;
  current_balance: number;
  last_calculated_at: Date;
}
`,

  // Repository
  'repositories/inventory-ledger.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class InventoryLedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMovement(data: any) {
    return this.prisma.inventoryMovement.create({ data });
  }

  async getLatestBalance(storeId: number, productId: number, warehouseId?: number, batchNumber?: string) {
    const whereClause: any = { store_id: storeId, product_id: productId };
    if (warehouseId) whereClause.warehouse_id = warehouseId;
    if (batchNumber) whereClause.batch_number = batchNumber;

    const latest = await this.prisma.inventoryMovement.findFirst({
      where: whereClause,
      orderBy: [
        { transaction_date: 'desc' },
        { id: 'desc' }
      ]
    });

    return latest ? latest.balance_after : 0;
  }

  async getMovements(storeId: number, productId: number) {
    return this.prisma.inventoryMovement.findMany({
      where: { store_id: storeId, product_id: productId },
      orderBy: [
        { transaction_date: 'asc' },
        { id: 'asc' }
      ]
    });
  }
}
`,

  // Validator
  'validators/inventory-ledger.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { RecordMovementDto } from '../interfaces/inventory-movement.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class InventoryLedgerValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateMovement(dto: RecordMovementDto) {
    if (dto.quantity_in < 0 || dto.quantity_out < 0) {
      throw new BadRequestException('Quantities must be positive. Use quantity_in or quantity_out to reflect direction.');
    }

    if (dto.quantity_in === 0 && dto.quantity_out === 0) {
      throw new BadRequestException('Movement must specify either quantity_in or quantity_out.');
    }

    if (dto.quantity_in > 0 && dto.quantity_out > 0) {
      throw new BadRequestException('Movement cannot have both quantity_in and quantity_out simultaneously.');
    }

    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.product_id }
    });

    if (!item) {
      throw new BadRequestException(\`Inventory item \${dto.product_id} not found.\`);
    }
  }
}
`,

  // Event
  'events/inventory-movement-recorded.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class InventoryMovementRecordedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'INVENTORY_MOVEMENT_RECORDED';
  occurred_at = new Date();
  entity_type = 'INVENTORY_LEDGER';

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
}
`,

  // Service
  'services/inventory-ledger.service.ts': `import { Injectable, Logger } from '@nestjs/common';
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
    this.logger.log(\`Recording Inventory Movement for Product \${dto.product_id}\`);

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
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
