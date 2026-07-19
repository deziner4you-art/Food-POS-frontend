const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/warehouse-transfer-created.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class WarehouseTransferCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'WAREHOUSE_TRANSFER_CREATED';
  occurred_at = new Date();
  entity_type = 'WAREHOUSE_TRANSFER';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/warehouse-transfer-approved.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class WarehouseTransferApprovedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'WAREHOUSE_TRANSFER_APPROVED';
  occurred_at = new Date();
  entity_type = 'WAREHOUSE_TRANSFER';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/warehouse-transfer-dispatched.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class WarehouseTransferDispatchedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'WAREHOUSE_TRANSFER_DISPATCHED';
  occurred_at = new Date();
  entity_type = 'WAREHOUSE_TRANSFER';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/warehouse-transfer-received.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class WarehouseTransferReceivedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'WAREHOUSE_TRANSFER_RECEIVED';
  occurred_at = new Date();
  entity_type = 'WAREHOUSE_TRANSFER';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/warehouse-transfer.interface.ts': `export interface CreateTransferRequestDto {
  transfer_number: string;
  source_store_id: number;
  source_warehouse_id?: number;
  dest_store_id: number;
  dest_warehouse_id?: number;
  remarks?: string;
  created_by: number;
}

export interface AddTransferLineDto {
  product_id: number;
  batch_id?: number;
  requested_quantity: number;
  remarks?: string;
}
`,

  'interfaces/transfer-result.interface.ts': `export interface TransferResult {
  transfer_id: number;
  transfer_number: string;
  status: string;
  total_items: number;
  total_value: number;
}
`,

  // Repository
  'repositories/warehouse-transfer.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class WarehouseTransferRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTransfer(data: any) {
    return this.prisma.warehouseTransfer.create({ data });
  }

  async findByTransferNumber(transferNumber: string) {
    return this.prisma.warehouseTransfer.findUnique({
      where: { transfer_number: transferNumber }
    });
  }

  async getTransfer(id: number) {
    return this.prisma.warehouseTransfer.findUnique({
      where: { id },
      include: { lines: true }
    });
  }

  async addLine(data: any) {
    return this.prisma.warehouseTransferLine.create({ data });
  }

  async updateTransferStatus(id: number, status: string, approvedBy?: number) {
    const data: any = { status };
    if (approvedBy) data.approved_by = approvedBy;
    return this.prisma.warehouseTransfer.update({ where: { id }, data });
  }

  async updateLineQuantities(lineId: number, data: any) {
    return this.prisma.warehouseTransferLine.update({ where: { id: lineId }, data });
  }
}
`,

  // Validator
  'validators/warehouse-transfer.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CreateTransferRequestDto } from '../interfaces/warehouse-transfer.interface';
import { InventoryLedgerService } from '../services/inventory-ledger.service';

@Injectable()
export class WarehouseTransferValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  async validateNewTransfer(dto: CreateTransferRequestDto) {
    if (dto.source_store_id === dto.dest_store_id && dto.source_warehouse_id === dto.dest_warehouse_id) {
      throw new BadRequestException('Source and destination cannot be identical.');
    }

    const existing = await this.prisma.warehouseTransfer.findUnique({
      where: { transfer_number: dto.transfer_number }
    });

    if (existing) {
      throw new BadRequestException(\`Duplicate transfer number (\${dto.transfer_number}) prohibited.\`);
    }
  }

  async validateTransferLine(sourceStoreId: number, productId: number, quantity: number, sourceWarehouseId?: number, batchId?: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Requested quantity must be positive.');
    }

    if (batchId) {
      const batch = await this.prisma.inventoryBatch.findUnique({ where: { id: batchId } });
      if (!batch) throw new BadRequestException('Batch not found.');
      if (batch.status === 'EXPIRED') throw new BadRequestException('Cannot transfer expired batch.');
      if (quantity > batch.available_quantity) throw new BadRequestException('Cannot exceed available batch quantity.');
    } else {
      const balanceResult = await this.ledgerService.getCurrentBalance(sourceStoreId, productId);
      if (balanceResult.current_balance < quantity) {
        throw new BadRequestException(\`Insufficient stock for transfer. Available: \${balanceResult.current_balance}\`);
      }
    }
  }

  async validateApproval(transferId: number) {
    const transfer = await this.prisma.warehouseTransfer.findUnique({ where: { id: transferId }, include: { lines: true } });
    if (!transfer) throw new BadRequestException('Transfer not found.');
    if (transfer.status !== 'PENDING_APPROVAL' && transfer.status !== 'DRAFT') {
      throw new BadRequestException(\`Transfer cannot be approved in status: \${transfer.status}\`);
    }
    if (transfer.lines.length === 0) throw new BadRequestException('Cannot approve an empty transfer.');
    return transfer;
  }
}
`,

  // Services
  'services/warehouse-transfer.service.ts': `import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { WarehouseTransferRepository } from '../repositories/warehouse-transfer.repository';
import { WarehouseTransferValidator } from '../validators/warehouse-transfer.validator';
import { CreateTransferRequestDto, AddTransferLineDto } from '../interfaces/warehouse-transfer.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { WarehouseTransferCreatedEvent } from '../events/warehouse-transfer-created.event';
import { BatchAllocationService } from './batch-allocation.service';
import { InventoryValuationService } from './inventory-valuation.service';

@Injectable()
export class WarehouseTransferService {
  private readonly logger = new Logger(WarehouseTransferService.name);

  constructor(
    private readonly repository: WarehouseTransferRepository,
    private readonly validator: WarehouseTransferValidator,
    private readonly eventBus: DomainEventBusService,
    private readonly valuationService: InventoryValuationService,
  ) {}

  async createTransferRequest(dto: CreateTransferRequestDto) {
    await this.validator.validateNewTransfer(dto);

    const transfer = await this.repository.createTransfer({
      transfer_number: dto.transfer_number,
      source_store_id: dto.source_store_id,
      source_warehouse_id: dto.source_warehouse_id,
      dest_store_id: dto.dest_store_id,
      dest_warehouse_id: dto.dest_warehouse_id,
      remarks: dto.remarks,
      created_by: dto.created_by,
      status: 'DRAFT',
    });

    this.eventBus.publish(new WarehouseTransferCreatedEvent(dto.source_store_id, 0, dto.created_by, transfer.id.toString(), 'createTransfer', transfer));
    return transfer;
  }

  async addTransferLine(transferId: number, dto: AddTransferLineDto) {
    const transfer = await this.repository.getTransfer(transferId);
    if (!transfer || (transfer.status !== 'DRAFT' && transfer.status !== 'PENDING_APPROVAL')) {
      throw new BadRequestException('Transfer is not open for adding lines.');
    }

    await this.validator.validateTransferLine(transfer.source_store_id, dto.product_id, dto.requested_quantity, transfer.source_warehouse_id || undefined, dto.batch_id);

    // Get valuation unit cost at time of request
    const valuation = await this.valuationService.calculateCost({
      store_id: transfer.source_store_id,
      warehouse_id: transfer.source_warehouse_id || 0,
      product_id: dto.product_id,
      movement_type: 'TRANSFER',
      quantity: dto.requested_quantity,
      transaction_date: new Date(),
      method: 'WEIGHTED_AVERAGE',
    }, transfer.created_by);

    await this.repository.addLine({
      transfer_id: transferId,
      product_id: dto.product_id,
      batch_id: dto.batch_id,
      requested_quantity: dto.requested_quantity,
      unit_cost: valuation.unit_cost,
      total_cost: valuation.total_cost,
      remarks: dto.remarks,
    });
  }

  async submitForApproval(transferId: number) {
    return this.repository.updateTransferStatus(transferId, 'PENDING_APPROVAL');
  }
}
`,

  'services/warehouse-transfer-approval.service.ts': `import { Injectable, Logger } from '@nestjs/common';
import { WarehouseTransferRepository } from '../repositories/warehouse-transfer.repository';
import { WarehouseTransferValidator } from '../validators/warehouse-transfer.validator';
import { TransferResult } from '../interfaces/transfer-result.interface';
import { InventoryLedgerService } from './inventory-ledger.service';
import { AccountingIntegrationService } from './accounting-integration.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { WarehouseTransferApprovedEvent } from '../events/warehouse-transfer-approved.event';
import { WarehouseTransferDispatchedEvent } from '../events/warehouse-transfer-dispatched.event';
import { WarehouseTransferReceivedEvent } from '../events/warehouse-transfer-received.event';
import { BusinessModule } from '../enums/business-module.enum';
import { BusinessEvent } from '../enums/business-event.enum';

@Injectable()
export class WarehouseTransferApprovalService {
  private readonly logger = new Logger(WarehouseTransferApprovalService.name);

  constructor(
    private readonly repository: WarehouseTransferRepository,
    private readonly validator: WarehouseTransferValidator,
    private readonly ledgerService: InventoryLedgerService,
    private readonly accountingIntegration: AccountingIntegrationService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async approveAndDispatch(transferId: number, approverId: number): Promise<TransferResult> {
    this.logger.log(\`Approving and Dispatching Transfer \${transferId}\`);

    const transfer = await this.validator.validateApproval(transferId);
    let totalTransferValue = 0;

    for (const line of transfer.lines) {
      totalTransferValue += line.total_cost;
      
      // Update line transferred quantity
      await this.repository.updateLineQuantities(line.id, { transferred_quantity: line.requested_quantity });

      // 1. Ledger OUT (Source)
      await this.ledgerService.recordMovement({
        store_id: transfer.source_store_id,
        warehouse_id: transfer.source_warehouse_id || undefined,
        product_id: line.product_id,
        movement_type: 'TRANSFER_OUT', // Will map logically in Ledger Service
        reference_module: 'WAREHOUSE_TRANSFER',
        reference_id: transfer.id.toString(),
        quantity_in: 0,
        quantity_out: line.requested_quantity,
        unit_cost: line.unit_cost,
        total_cost: line.total_cost,
        created_by: approverId,
        transaction_date: new Date(),
      });
    }

    await this.repository.updateTransferStatus(transferId, 'IN_TRANSIT', approverId);

    const result: TransferResult = {
      transfer_id: transfer.id,
      transfer_number: transfer.transfer_number,
      total_items: transfer.lines.length,
      total_value: totalTransferValue,
      status: 'IN_TRANSIT',
    };

    this.eventBus.publish(new WarehouseTransferApprovedEvent(transfer.source_store_id, 0, approverId, transfer.id.toString(), 'approveTransfer', transfer));
    this.eventBus.publish(new WarehouseTransferDispatchedEvent(transfer.source_store_id, 0, approverId, transfer.id.toString(), 'dispatchTransfer', result));

    return result;
  }

  async receiveTransfer(transferId: number, receiverId: number): Promise<TransferResult> {
    this.logger.log(\`Receiving Transfer \${transferId}\`);

    const transfer = await this.repository.getTransfer(transferId);
    if (!transfer || transfer.status !== 'IN_TRANSIT') {
      throw new Error('Transfer must be IN_TRANSIT to receive.');
    }

    let totalTransferValue = 0;

    for (const line of transfer.lines) {
      totalTransferValue += line.total_cost;
      
      // We assume full receipt for simplicity, mapping partial receipt is a business logic extension
      await this.repository.updateLineQuantities(line.id, { received_quantity: line.transferred_quantity });

      // 2. Ledger IN (Destination)
      await this.ledgerService.recordMovement({
        store_id: transfer.dest_store_id,
        warehouse_id: transfer.dest_warehouse_id || undefined,
        product_id: line.product_id,
        movement_type: 'TRANSFER_IN',
        reference_module: 'WAREHOUSE_TRANSFER',
        reference_id: transfer.id.toString(),
        quantity_in: line.transferred_quantity,
        quantity_out: 0,
        unit_cost: line.unit_cost,
        total_cost: line.total_cost,
        created_by: receiverId,
        transaction_date: new Date(),
      });
    }

    // 3. Accounting Integration (One consolidated entry mapping Source & Dest if supported, or generic INVENTORY_TRANSFER)
    await this.accountingIntegration.processBusinessEvent({
      tenant_id: 0,
      store_id: transfer.source_store_id, // Initiating store
      business_module: BusinessModule.INVENTORY,
      business_event: 'INVENTORY_TRANSFER' as BusinessEvent,
      business_document_id: transfer.transfer_number,
      document_number: transfer.transfer_number,
      transaction_date: new Date(),
      user_id: receiverId,
      reference: \`Inter-Warehouse Transfer: \${transfer.transfer_number}\`,
      amount: totalTransferValue,
      metadata: { transfer_id: transfer.id, dest_store_id: transfer.dest_store_id }
    });

    await this.repository.updateTransferStatus(transferId, 'RECEIVED');

    const result: TransferResult = {
      transfer_id: transfer.id,
      transfer_number: transfer.transfer_number,
      total_items: transfer.lines.length,
      total_value: totalTransferValue,
      status: 'RECEIVED',
    };

    this.eventBus.publish(new WarehouseTransferReceivedEvent(transfer.dest_store_id, 0, receiverId, transfer.id.toString(), 'receiveTransfer', result));

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
