import { Injectable, Logger } from '@nestjs/common';
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
    this.logger.log(`Creating new batch ${dto.batch_number} for product ${dto.product_id}`);
    
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
    this.logger.log(`Consuming ${quantity} from batch ${batchId}`);
    
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
