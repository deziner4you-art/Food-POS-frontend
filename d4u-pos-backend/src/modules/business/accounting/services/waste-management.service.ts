import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
    this.logger.log(`Approving and Posting Waste Session ${sessionId}`);

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
      reference: `Waste & Spoilage - ${session.reference_number}`,
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
