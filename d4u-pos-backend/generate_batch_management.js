const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/batch-created.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BatchCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BATCH_CREATED';
  occurred_at = new Date();
  entity_type = 'BATCH_MANAGEMENT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/batch-allocated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BatchAllocatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BATCH_ALLOCATED';
  occurred_at = new Date();
  entity_type = 'BATCH_MANAGEMENT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/batch-consumed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BatchConsumedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BATCH_CONSUMED';
  occurred_at = new Date();
  entity_type = 'BATCH_MANAGEMENT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/batch-expired.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BatchExpiredEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BATCH_EXPIRED';
  occurred_at = new Date();
  entity_type = 'BATCH_MANAGEMENT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/batch-transferred.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BatchTransferredEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BATCH_TRANSFERRED';
  occurred_at = new Date();
  entity_type = 'BATCH_MANAGEMENT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/batch.interface.ts': `export interface CreateBatchDto {
  store_id: number;
  warehouse_id?: number;
  product_id: number;
  batch_number: string;
  lot_number?: string;
  manufacturing_date?: Date;
  expiry_date?: Date;
  received_quantity: number;
  unit_cost: number;
  valuation_method?: string;
  created_by: number;
}

export interface RecordBatchMovementDto {
  batch_id: number;
  movement_type: 'GRN' | 'CONSUMPTION' | 'WASTE' | 'TRANSFER';
  reference_module: string;
  reference_id: string;
  quantity_in: number;
  quantity_out: number;
  created_by: number;
}
`,

  'interfaces/batch-allocation.interface.ts': `export interface AllocateBatchRequest {
  store_id: number;
  warehouse_id?: number;
  product_id: number;
  quantity_required: number;
  strategy: 'FIFO' | 'FEFO' | 'MANUAL';
  manual_batch_number?: string;
}

export interface AllocationResult {
  batch_id: number;
  batch_number: string;
  allocated_quantity: number;
  unit_cost: number;
}
`,

  'interfaces/expiry.interface.ts': `export interface ExpiryMonitorResult {
  store_id: number;
  scan_date: Date;
  expired_today: number;
  expiring_7_days: number;
  expiring_30_days: number;
  already_expired: number;
  batches_updated: number;
}
`,

  // Repository
  'repositories/batch.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class BatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBatch(data: any) {
    return this.prisma.inventoryBatch.create({ data });
  }

  async findByBatchNumber(storeId: number, productId: number, batchNumber: string, warehouseId?: number) {
    const where: any = { store_id: storeId, product_id: productId, batch_number: batchNumber };
    if (warehouseId) where.warehouse_id = warehouseId;
    return this.prisma.inventoryBatch.findUnique({ where: { store_id_warehouse_id_product_id_batch_number: where } });
  }

  async getBatch(id: number) {
    return this.prisma.inventoryBatch.findUnique({ where: { id } });
  }

  async getAvailableBatches(storeId: number, productId: number, warehouseId?: number) {
    const where: any = { store_id: storeId, product_id: productId, status: 'ACTIVE', available_quantity: { gt: 0 } };
    if (warehouseId) where.warehouse_id = warehouseId;
    
    return this.prisma.inventoryBatch.findMany({ where });
  }

  async updateQuantities(batchId: number, data: any) {
    return this.prisma.inventoryBatch.update({ where: { id: batchId }, data });
  }

  async recordMovement(data: any) {
    return this.prisma.batchMovement.create({ data });
  }

  async createReservation(data: any) {
    return this.prisma.batchReservation.create({ data });
  }

  async updateBatchStatus(id: number, status: string) {
    return this.prisma.inventoryBatch.update({ where: { id }, data: { status } });
  }
}
`,

  // Validator
  'validators/batch.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CreateBatchDto } from '../interfaces/batch.interface';

@Injectable()
export class BatchValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateCreateBatch(dto: CreateBatchDto) {
    if (dto.manufacturing_date && dto.expiry_date) {
      if (new Date(dto.expiry_date) <= new Date(dto.manufacturing_date)) {
        throw new BadRequestException('Expiry date must be after manufacturing date.');
      }
    }

    const where: any = { store_id: dto.store_id, product_id: dto.product_id, batch_number: dto.batch_number };
    if (dto.warehouse_id) where.warehouse_id = dto.warehouse_id;

    const existing = await this.prisma.inventoryBatch.findUnique({
      where: { store_id_warehouse_id_product_id_batch_number: where }
    });

    if (existing) {
      throw new BadRequestException(\`Batch number \${dto.batch_number} already exists for this product in this location.\`);
    }
  }

  async validateConsumption(batchId: number, quantityToConsume: number) {
    const batch = await this.prisma.inventoryBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new BadRequestException('Batch not found.');

    if (batch.status === 'EXPIRED') {
      throw new BadRequestException('Cannot consume expired batch.');
    }

    if (quantityToConsume > batch.available_quantity) {
      throw new BadRequestException(\`Cannot exceed available quantity. Requested: \${quantityToConsume}, Available: \${batch.available_quantity}\`);
    }

    return batch;
  }
}
`,

  // Services
  'services/batch-management.service.ts': `import { Injectable, Logger } from '@nestjs/common';
import { BatchRepository } from '../repositories/batch.repository';
import { BatchValidator } from '../validators/batch.validator';
import { CreateBatchDto, RecordBatchMovementDto } from '../interfaces/batch.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BatchCreatedEvent } from '../events/batch-created.event';
import { BatchConsumedEvent } from '../events/batch-consumed.event';

@Injectable()
export class BatchManagementService {
  private readonly logger = new Logger(BatchManagementService.name);

  constructor(
    private readonly repository: BatchRepository,
    private readonly validator: BatchValidator,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async createBatch(dto: CreateBatchDto) {
    this.logger.log(\`Creating new batch \${dto.batch_number} for product \${dto.product_id}\`);
    
    await this.validator.validateCreateBatch(dto);

    const batch = await this.repository.createBatch({
      store_id: dto.store_id,
      warehouse_id: dto.warehouse_id,
      product_id: dto.product_id,
      batch_number: dto.batch_number,
      lot_number: dto.lot_number,
      manufacturing_date: dto.manufacturing_date,
      expiry_date: dto.expiry_date,
      received_quantity: dto.received_quantity,
      available_quantity: dto.received_quantity,
      unit_cost: dto.unit_cost,
      valuation_method: dto.valuation_method || 'WEIGHTED_AVERAGE',
      created_by: dto.created_by,
    });

    this.eventBus.publish(new BatchCreatedEvent(dto.store_id, 0, dto.created_by, batch.id.toString(), 'createBatch', batch));
    return batch;
  }

  async consumeBatch(batchId: number, quantity: number, referenceModule: string, referenceId: string, userId: number) {
    this.logger.log(\`Consuming \${quantity} from batch \${batchId}\`);
    
    const batch = await this.validator.validateConsumption(batchId, quantity);

    const updatedBatch = await this.repository.updateQuantities(batchId, {
      available_quantity: { decrement: quantity },
      consumed_quantity: { increment: quantity },
      status: (batch.available_quantity - quantity) === 0 ? 'DEPLETED' : batch.status
    });

    await this.repository.recordMovement({
      batch_id: batchId,
      movement_type: 'CONSUMPTION',
      reference_module: referenceModule,
      reference_id: referenceId,
      quantity_out: quantity,
      created_by: userId,
    });

    this.eventBus.publish(new BatchConsumedEvent(batch.store_id, 0, userId, batchId.toString(), 'consumeBatch', { batchId, quantity, referenceId }));

    return updatedBatch;
  }
}
`,

  'services/batch-allocation.service.ts': `import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { BatchRepository } from '../repositories/batch.repository';
import { AllocateBatchRequest, AllocationResult } from '../interfaces/batch-allocation.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BatchAllocatedEvent } from '../events/batch-allocated.event';

@Injectable()
export class BatchAllocationService {
  private readonly logger = new Logger(BatchAllocationService.name);

  constructor(
    private readonly repository: BatchRepository,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async allocate(request: AllocateBatchRequest, userId: number): Promise<AllocationResult[]> {
    this.logger.log(\`Allocating \${request.quantity_required} of product \${request.product_id} using \${request.strategy}\`);
    
    let batches = await this.repository.getAvailableBatches(request.store_id, request.product_id, request.warehouse_id);

    if (request.strategy === 'FIFO') {
      batches = batches.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
    } else if (request.strategy === 'FEFO') {
      batches = batches.filter(b => b.expiry_date).sort((a, b) => a.expiry_date.getTime() - b.expiry_date.getTime());
      if (batches.length === 0) {
        throw new BadRequestException('No batches with expiry dates available for FEFO allocation.');
      }
    } else if (request.strategy === 'MANUAL') {
      if (!request.manual_batch_number) throw new BadRequestException('manual_batch_number required for MANUAL strategy.');
      batches = batches.filter(b => b.batch_number === request.manual_batch_number);
    }

    let remainingQuantity = request.quantity_required;
    const allocations: AllocationResult[] = [];

    for (const batch of batches) {
      if (remainingQuantity <= 0) break;

      const toAllocate = Math.min(remainingQuantity, batch.available_quantity);
      
      allocations.push({
        batch_id: batch.id,
        batch_number: batch.batch_number,
        allocated_quantity: toAllocate,
        unit_cost: batch.unit_cost,
      });

      remainingQuantity -= toAllocate;
    }

    if (remainingQuantity > 0) {
      throw new BadRequestException(\`Insufficient batch quantities to satisfy allocation. Missing \${remainingQuantity}\`);
    }

    this.eventBus.publish(new BatchAllocatedEvent(request.store_id, 0, userId, request.product_id.toString(), 'allocateBatch', allocations));

    return allocations;
  }
}
`,

  'services/expiry-monitor.service.ts': `import { Injectable, Logger } from '@nestjs/common';
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
    this.logger.log(\`Scanning expiries for store \${storeId}\`);
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
      const expiryDate = new Date(batch.expiry_date);
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
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
