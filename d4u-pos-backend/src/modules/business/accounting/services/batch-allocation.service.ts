import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
    this.logger.log(`Allocating ${request.quantity_required} of product ${request.product_id} using ${request.strategy}`);
    
    let batches = await this.repository.getAvailableBatches(request.store_id, request.product_id, request.warehouse_id);

    if (request.strategy === 'FIFO') {
      batches = batches.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
    } else if (request.strategy === 'FEFO') {
      batches = batches.filter(b => b.expiry_date).sort((a, b) => a.expiry_date!.getTime() - b.expiry_date!.getTime());
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
      throw new BadRequestException(`Insufficient batch quantities to satisfy allocation. Missing ${remainingQuantity}`);
    }

    this.eventBus.publish(new BatchAllocatedEvent(request.store_id, 0, userId, request.product_id.toString(), 'allocateBatch', allocations));

    return allocations;
  }
}
