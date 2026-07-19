import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
