const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/stock-count-completed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class StockCountCompletedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'STOCK_COUNT_COMPLETED';
  occurred_at = new Date();
  entity_type = 'STOCK_COUNT';

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

  'events/inventory-reconciled.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class InventoryReconciledEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'INVENTORY_RECONCILED';
  occurred_at = new Date();
  entity_type = 'RECONCILIATION';

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

  // Interfaces
  'interfaces/stock-count.interface.ts': `export interface CreateStockCountDto {
  store_id: number;
  warehouse_id?: number;
  scheduled_date: Date;
  remarks?: string;
  created_by: number;
}

export interface RecordPhysicalCountDto {
  product_id: number;
  physical_quantity: number;
  remarks?: string;
}
`,

  'interfaces/reconciliation-result.interface.ts': `export interface ReconciliationResult {
  session_id: number;
  total_items_counted: number;
  total_variance_value: number;
  gain_value: number;
  loss_value: number;
  status: 'RECONCILED' | 'FAILED';
  accounting_voucher_id?: number;
  errors?: string[];
}
`,

  // Repository
  'repositories/stock-count.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class StockCountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(data: any) {
    return this.prisma.stockCountSession.create({ data });
  }

  async getSession(id: number) {
    return this.prisma.stockCountSession.findUnique({
      where: { id },
      include: { lines: true }
    });
  }

  async updateSessionStatus(id: number, status: string, approvedBy?: number) {
    const data: any = { status };
    if (approvedBy) data.approved_by = approvedBy;
    if (status === 'RECONCILED' || status === 'REVIEW') data.completed_at = new Date();

    return this.prisma.stockCountSession.update({
      where: { id },
      data,
    });
  }

  async createOrUpdateLine(sessionId: number, productId: number, systemQuantity: number, physicalQuantity: number, unitCost: number, variance: number, remarks?: string) {
    const existing = await this.prisma.stockCountLine.findFirst({
      where: { session_id: sessionId, product_id: productId }
    });

    if (existing) {
      return this.prisma.stockCountLine.update({
        where: { id: existing.id },
        data: { physical_quantity: physicalQuantity, variance, remarks }
      });
    }

    return this.prisma.stockCountLine.create({
      data: {
        session_id: sessionId,
        product_id: productId,
        system_quantity: systemQuantity,
        physical_quantity: physicalQuantity,
        variance,
        unit_cost: unitCost,
        remarks
      }
    });
  }
}
`,

  // Validator
  'validators/stock-count.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class StockCountValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateActiveSession(storeId: number, warehouseId?: number) {
    // Ensure no other active counting session is open for the same location
    const active = await this.prisma.stockCountSession.findFirst({
      where: {
        store_id: storeId,
        warehouse_id: warehouseId,
        status: { in: ['DRAFT', 'COUNTING', 'REVIEW'] }
      }
    });

    if (active) {
      throw new BadRequestException(\`An active stock count session (\${active.id}) already exists for this location.\`);
    }
  }

  validatePhysicalCount(quantity: number) {
    if (quantity < 0) {
      throw new BadRequestException('Physical count quantity cannot be negative.');
    }
  }

  async validateApproval(sessionId: number) {
    const session = await this.prisma.stockCountSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new BadRequestException('Session not found.');
    if (session.status !== 'REVIEW') {
      throw new BadRequestException(\`Session cannot be approved in status: \${session.status}\`);
    }
  }
}
`,

  // Services
  'services/stock-count.service.ts': `import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StockCountRepository } from '../repositories/stock-count.repository';
import { StockCountValidator } from '../validators/stock-count.validator';
import { CreateStockCountDto, RecordPhysicalCountDto } from '../interfaces/stock-count.interface';
import { InventoryLedgerService } from './inventory-ledger.service';
import { InventoryValuationService } from './inventory-valuation.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { StockCountCompletedEvent } from '../events/stock-count-completed.event';

@Injectable()
export class StockCountService {
  private readonly logger = new Logger(StockCountService.name);

  constructor(
    private readonly repository: StockCountRepository,
    private readonly validator: StockCountValidator,
    private readonly ledgerService: InventoryLedgerService,
    private readonly valuationService: InventoryValuationService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async createSession(dto: CreateStockCountDto) {
    await this.validator.validateActiveSession(dto.store_id, dto.warehouse_id);

    const session = await this.repository.createSession({
      store_id: dto.store_id,
      warehouse_id: dto.warehouse_id,
      scheduled_date: dto.scheduled_date,
      remarks: dto.remarks,
      created_by: dto.created_by,
      status: 'COUNTING',
    });

    return session;
  }

  async recordCount(sessionId: number, dto: RecordPhysicalCountDto) {
    this.validator.validatePhysicalCount(dto.physical_quantity);
    
    const session = await this.repository.getSession(sessionId);
    if (!session || session.status !== 'COUNTING') {
      throw new BadRequestException('Session is not active for counting.');
    }

    // Freeze system quantity
    const balance = await this.ledgerService.getCurrentBalance(session.store_id, dto.product_id);
    const systemQuantity = balance.current_balance;
    const variance = dto.physical_quantity - systemQuantity;

    // Get Valuation (Unit Cost at the time of freeze)
    const valuation = await this.valuationService.calculateCost({
      store_id: session.store_id,
      warehouse_id: session.warehouse_id || 0,
      product_id: dto.product_id,
      movement_type: 'STOCK_ADJUSTMENT',
      quantity: 1, // evaluate 1 unit cost
      transaction_date: new Date(),
      method: 'WEIGHTED_AVERAGE', // default fallback
    }, session.created_by);

    await this.repository.createOrUpdateLine(
      sessionId,
      dto.product_id,
      systemQuantity,
      dto.physical_quantity,
      valuation.unit_cost,
      variance,
      dto.remarks
    );
  }

  async finishCounting(sessionId: number, userId: number) {
    const session = await this.repository.updateSessionStatus(sessionId, 'REVIEW');
    
    this.eventBus.publish(new StockCountCompletedEvent(
      session.store_id, 0, userId, sessionId.toString(), 'finishCounting', session
    ));

    return session;
  }
}
`,

  'services/inventory-reconciliation.service.ts': `import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StockCountRepository } from '../repositories/stock-count.repository';
import { StockCountValidator } from '../validators/stock-count.validator';
import { InventoryLedgerService } from './inventory-ledger.service';
import { AccountingIntegrationService } from './accounting-integration.service';
import { ReconciliationResult } from '../interfaces/reconciliation-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { InventoryReconciledEvent } from '../events/inventory-reconciled.event';
import { BusinessModule } from '../enums/business-module.enum';

@Injectable()
export class InventoryReconciliationService {
  private readonly logger = new Logger(InventoryReconciliationService.name);

  constructor(
    private readonly repository: StockCountRepository,
    private readonly validator: StockCountValidator,
    private readonly ledgerService: InventoryLedgerService,
    private readonly accountingIntegration: AccountingIntegrationService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async approveAndReconcile(sessionId: number, approverId: number): Promise<ReconciliationResult> {
    this.logger.log(\`Approving & Reconciling Stock Count Session \${sessionId}\`);

    await this.validator.validateApproval(sessionId);
    const session = await this.repository.getSession(sessionId);
    
    if (!session || !session.lines || session.lines.length === 0) {
      throw new BadRequestException('Session is empty.');
    }

    let totalGain = 0;
    let totalLoss = 0;

    for (const line of session.lines) {
      if (!line.variance || line.variance === 0) continue;

      const totalCost = Math.abs(line.variance) * line.unit_cost;
      
      // 1. Generate Inventory Movement
      await this.ledgerService.recordMovement({
        store_id: session.store_id,
        warehouse_id: session.warehouse_id || undefined,
        product_id: line.product_id,
        movement_type: 'STOCK_ADJUSTMENT',
        reference_module: 'STOCK_COUNT',
        reference_id: session.id.toString(),
        quantity_in: line.variance > 0 ? line.variance : 0,
        quantity_out: line.variance < 0 ? Math.abs(line.variance) : 0,
        unit_cost: line.unit_cost,
        total_cost: totalCost,
        created_by: approverId,
        transaction_date: new Date(),
      });

      // 2. Generate Accounting Event
      const businessEvent = line.variance > 0 ? 'STOCK_GAIN' : 'STOCK_LOSS';
      if (line.variance > 0) totalGain += totalCost;
      if (line.variance < 0) totalLoss += totalCost;

      // Note: In an enterprise setting, we batch these lines into a single AccountingRequest voucher.
      // For this bridge, we can send each line as a request or aggregate them.
      // To strictly follow the "No direct ledger access" and "Everything flows through integration",
      // we'll send a bulk/aggregated request if needed, but per-line provides granularity.
      // Since AccountingIntegrationService processes one event, we invoke it per variance line for exact tracing.
      
      await this.accountingIntegration.processBusinessEvent({
        tenant_id: 0,
        store_id: session.store_id,
        business_module: BusinessModule.INVENTORY,
        business_event: businessEvent,
        business_document_id: \`STC-\${session.id}-L\${line.id}\`,
        document_number: \`STC-\${session.id}-L\${line.id}\`,
        transaction_date: new Date(),
        user_id: approverId,
        reference: \`Stock \${line.variance > 0 ? 'Gain' : 'Loss'} for Session \${session.id}, Product \${line.product_id}\`,
        amount: totalCost,
        metadata: {
          session_id: session.id,
          product_id: line.product_id,
          variance: line.variance,
        }
      });
    }

    // Mark completed
    await this.repository.updateSessionStatus(sessionId, 'RECONCILED', approverId);

    const result: ReconciliationResult = {
      session_id: sessionId,
      total_items_counted: session.lines.length,
      total_variance_value: totalGain - totalLoss,
      gain_value: totalGain,
      loss_value: totalLoss,
      status: 'RECONCILED',
    };

    this.eventBus.publish(new InventoryReconciledEvent(
      session.store_id, 0, approverId, sessionId.toString(), 'reconcile', result
    ));

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
