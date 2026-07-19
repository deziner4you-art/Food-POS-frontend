const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/waste-approved.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class WasteApprovedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'WASTE_APPROVED';
  occurred_at = new Date();
  entity_type = 'WASTE_MANAGEMENT';

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

  'events/waste-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class WastePostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'WASTE_POSTED';
  occurred_at = new Date();
  entity_type = 'WASTE_MANAGEMENT';

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

  'events/inventory-waste-recorded.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class InventoryWasteRecordedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'INVENTORY_WASTE_RECORDED';
  occurred_at = new Date();
  entity_type = 'WASTE_MANAGEMENT';

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
  'interfaces/waste-request.interface.ts': `export interface CreateWasteSessionDto {
  store_id: number;
  warehouse_id?: number;
  reference_number: string;
  remarks?: string;
  created_by: number;
  transaction_date?: Date;
}

export interface AddWasteLineDto {
  product_id: number;
  batch_number?: string;
  waste_reason: 'Expired' | 'Spoiled' | 'Kitchen Waste' | 'Customer Return (Discard)' | 'Production Loss' | 'Damaged' | 'Broken' | 'Quality Failure' | 'Manual Approved Disposal';
  quantity: number;
  image_url?: string;
  remarks?: string;
}
`,

  'interfaces/waste-result.interface.ts': `export interface WasteResult {
  session_id: number;
  reference_number: string;
  total_items: number;
  total_waste_value: number;
  status: 'POSTED' | 'FAILED';
  accounting_voucher_id?: number;
  errors?: string[];
}
`,

  // Repository
  'repositories/waste.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class WasteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(data: any) {
    return this.prisma.wasteSession.create({ data });
  }

  async findByReference(storeId: number, referenceNumber: string) {
    return this.prisma.wasteSession.findFirst({
      where: { store_id: storeId, reference_number: referenceNumber }
    });
  }

  async getSession(id: number) {
    return this.prisma.wasteSession.findUnique({
      where: { id },
      include: { lines: true }
    });
  }

  async addLine(data: any) {
    return this.prisma.wasteLine.create({ data });
  }

  async updateSessionStatus(id: number, status: string, approvedBy?: number) {
    const data: any = { status };
    if (approvedBy) data.approved_by = approvedBy;

    return this.prisma.wasteSession.update({
      where: { id },
      data,
    });
  }
}
`,

  // Validator
  'validators/waste.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { InventoryLedgerService } from '../services/inventory-ledger.service';

@Injectable()
export class WasteValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: InventoryLedgerService
  ) {}

  async validateNewSession(storeId: number, referenceNumber: string) {
    const existing = await this.prisma.wasteSession.findFirst({
      where: { store_id: storeId, reference_number: referenceNumber }
    });
    if (existing) {
      throw new BadRequestException(\`Duplicate waste reference (\${referenceNumber}) prohibited.\`);
    }
  }

  async validateWasteLine(storeId: number, productId: number, quantity: number, warehouseId?: number, batchNumber?: string) {
    if (quantity <= 0) {
      throw new BadRequestException('Waste quantity must be positive.');
    }

    const balanceResult = await this.ledgerService.getCurrentBalance(storeId, productId); // Simplified
    
    if (balanceResult.current_balance < quantity) {
      throw new BadRequestException(\`Insufficient stock for waste recording on Product \${productId}. Available: \${balanceResult.current_balance}, Waste Requested: \${quantity}\`);
    }
  }

  async validateApproval(sessionId: number) {
    const session = await this.prisma.wasteSession.findUnique({ where: { id: sessionId }, include: { lines: true } });
    if (!session) throw new BadRequestException('Waste session not found.');
    if (session.status !== 'REVIEW' && session.status !== 'DRAFT') {
      throw new BadRequestException(\`Waste session cannot be approved in status: \${session.status}\`);
    }
    if (session.lines.length === 0) {
      throw new BadRequestException('Cannot approve an empty waste session.');
    }
    return session;
  }
}
`,

  // Service
  'services/waste-management.service.ts': `import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { WasteRepository } from '../repositories/waste.repository';
import { WasteValidator } from '../validators/waste.validator';
import { CreateWasteSessionDto, AddWasteLineDto } from '../interfaces/waste-request.interface';
import { WasteResult } from '../interfaces/waste-result.interface';
import { InventoryLedgerService } from './inventory-ledger.service';
import { InventoryValuationService } from './inventory-valuation.service';
import { AccountingIntegrationService } from './accounting-integration.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { WasteApprovedEvent } from '../events/waste-approved.event';
import { WastePostedEvent } from '../events/waste-posted.event';
import { InventoryWasteRecordedEvent } from '../events/inventory-waste-recorded.event';
import { BusinessModule } from '../enums/business-module.enum';
import { BusinessEvent } from '../enums/business-event.enum';

@Injectable()
export class WasteManagementService {
  private readonly logger = new Logger(WasteManagementService.name);

  constructor(
    private readonly repository: WasteRepository,
    private readonly validator: WasteValidator,
    private readonly ledgerService: InventoryLedgerService,
    private readonly valuationService: InventoryValuationService,
    private readonly accountingIntegration: AccountingIntegrationService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async createWasteSession(dto: CreateWasteSessionDto) {
    await this.validator.validateNewSession(dto.store_id, dto.reference_number);

    return this.repository.createSession({
      store_id: dto.store_id,
      warehouse_id: dto.warehouse_id,
      reference_number: dto.reference_number,
      remarks: dto.remarks,
      created_by: dto.created_by,
      transaction_date: dto.transaction_date || new Date(),
    });
  }

  async addWasteItem(sessionId: number, dto: AddWasteLineDto) {
    const session = await this.repository.getSession(sessionId);
    if (!session || (session.status !== 'DRAFT' && session.status !== 'REVIEW')) {
      throw new BadRequestException('Session is not open for adding items.');
    }

    await this.validator.validateWasteLine(session.store_id, dto.product_id, dto.quantity, session.warehouse_id || undefined, dto.batch_number);

    // Calculate valuation at time of recording
    const valuation = await this.valuationService.calculateCost({
      store_id: session.store_id,
      warehouse_id: session.warehouse_id || 0,
      product_id: dto.product_id,
      movement_type: 'DISPOSAL',
      quantity: dto.quantity,
      transaction_date: new Date(),
      method: 'WEIGHTED_AVERAGE', // default
    }, session.created_by);

    await this.repository.addLine({
      session_id: sessionId,
      product_id: dto.product_id,
      batch_number: dto.batch_number,
      waste_reason: dto.waste_reason,
      quantity: dto.quantity,
      unit_cost: valuation.unit_cost,
      total_cost: valuation.total_cost,
      image_url: dto.image_url,
      remarks: dto.remarks,
    });
  }

  async submitForApproval(sessionId: number) {
    return this.repository.updateSessionStatus(sessionId, 'REVIEW');
  }

  async approveAndPost(sessionId: number, approverId: number): Promise<WasteResult> {
    this.logger.log(\`Approving and Posting Waste Session \${sessionId}\`);

    const session = await this.validator.validateApproval(sessionId);
    
    // Publish Approved Event
    this.eventBus.publish(new WasteApprovedEvent(session.store_id, 0, approverId, session.id.toString(), 'approveWaste', session));

    let totalWasteValue = 0;

    for (const line of session.lines) {
      totalWasteValue += line.total_cost;

      // 1. Post to Inventory Ledger (Strict rule: No direct deduction)
      await this.ledgerService.recordMovement({
        store_id: session.store_id,
        warehouse_id: session.warehouse_id || undefined,
        product_id: line.product_id,
        batch_number: line.batch_number || undefined,
        movement_type: 'WASTE', // as per enum
        reference_module: 'WASTE_MANAGEMENT',
        reference_id: session.id.toString(),
        quantity_in: 0,
        quantity_out: line.quantity,
        unit_cost: line.unit_cost,
        total_cost: line.total_cost,
        created_by: approverId,
        transaction_date: new Date(),
      });

      this.eventBus.publish(new InventoryWasteRecordedEvent(session.store_id, 0, approverId, line.id.toString(), 'wasteLine', line));
    }

    // 2. Post to Accounting Integration (Strict rule: Flow through integration)
    const accountingResponse = await this.accountingIntegration.processBusinessEvent({
      tenant_id: 0,
      store_id: session.store_id,
      business_module: BusinessModule.INVENTORY,
      business_event: 'WASTE_POSTING' as BusinessEvent, // Will be mapped to WASTE_POSTING
      business_document_id: session.reference_number,
      document_number: session.reference_number,
      transaction_date: session.transaction_date,
      user_id: approverId,
      reference: \`Waste & Spoilage - \${session.reference_number}\`,
      amount: totalWasteValue,
      metadata: { session_id: session.id }
    });

    await this.repository.updateSessionStatus(sessionId, 'POSTED', approverId);

    const result: WasteResult = {
      session_id: session.id,
      reference_number: session.reference_number,
      total_items: session.lines.length,
      total_waste_value: totalWasteValue,
      status: 'POSTED',
    };

    this.eventBus.publish(new WastePostedEvent(session.store_id, 0, approverId, session.id.toString(), 'postWaste', result));

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
