import { Injectable, Logger } from '@nestjs/common';
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
    this.logger.log(`Approving and Dispatching Transfer ${transferId}`);

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
    this.logger.log(`Receiving Transfer ${transferId}`);

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
      reference: `Inter-Warehouse Transfer: ${transfer.transfer_number}`,
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
