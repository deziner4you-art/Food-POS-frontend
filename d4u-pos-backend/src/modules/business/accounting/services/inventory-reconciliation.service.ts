import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
    this.logger.log(`Approving & Reconciling Stock Count Session ${sessionId}`);

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
        business_document_id: `STC-${session.id}-L${line.id}`,
        document_number: `STC-${session.id}-L${line.id}`,
        transaction_date: new Date(),
        user_id: approverId,
        reference: `Stock ${line.variance > 0 ? 'Gain' : 'Loss'} for Session ${session.id}, Product ${line.product_id}`,
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
