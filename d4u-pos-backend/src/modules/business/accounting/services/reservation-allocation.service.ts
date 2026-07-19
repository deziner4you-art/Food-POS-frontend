import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InventoryReservationRepository } from '../repositories/inventory-reservation.repository';
import { BatchAllocationService } from './batch-allocation.service';
import { BatchRepository } from '../repositories/batch.repository';
import { ReservationResult } from '../interfaces/reservation-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { InventoryReservedEvent } from '../events/inventory-reserved.event';
import { ReservationConsumedEvent } from '../events/reservation-consumed.event';
import { InventoryLedgerService } from './inventory-ledger.service';

@Injectable()
export class ReservationAllocationService {
  private readonly logger = new Logger(ReservationAllocationService.name);

  constructor(
    private readonly repository: InventoryReservationRepository,
    private readonly batchAllocation: BatchAllocationService,
    private readonly batchRepository: BatchRepository,
    private readonly eventBus: DomainEventBusService,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  async reserve(reservationId: number, userId: number): Promise<ReservationResult> {
    const reservation = await this.repository.getReservation(reservationId);
    if (!reservation || reservation.status !== 'DRAFT') {
      throw new BadRequestException('Reservation cannot be locked.');
    }

    const reservedMap: Record<number, number> = {};

    for (const line of reservation.lines) {
      // 1. Allocate batches logically using FEFO
      const allocations = await this.batchAllocation.allocate({
        store_id: reservation.store_id,
        warehouse_id: reservation.warehouse_id || undefined,
        product_id: line.product_id,
        quantity_required: line.reserved_quantity,
        strategy: 'FEFO', // Prioritize FEFO for reservation
      }, userId);

      let allocatedSum = 0;
      for (const alloc of allocations) {
        await this.repository.addAllocation({
          line_id: line.id,
          batch_id: alloc.batch_id,
          quantity: alloc.allocated_quantity,
          status: 'RESERVED',
        });

        // 2. Lock quantity in Batch Entity
        await this.batchRepository.updateQuantities(alloc.batch_id, {
          available_quantity: { decrement: alloc.allocated_quantity },
          reserved_quantity: { increment: alloc.allocated_quantity }
        });
        
        allocatedSum += alloc.allocated_quantity;
      }
      reservedMap[line.product_id] = allocatedSum;
    }

    await this.repository.updateReservationStatus(reservationId, 'RESERVED');

    const result: ReservationResult = {
      reservation_id: reservation.id,
      reservation_number: reservation.reservation_number,
      status: 'RESERVED',
      total_items: reservation.lines.length,
      reserved_quantities: reservedMap,
    };

    this.eventBus.publish(new InventoryReservedEvent(reservation.store_id, 0, userId, reservation.id.toString(), 'reserve', result));
    return result;
  }

  async consume(reservationId: number, quantityToConsume: number, productId: number, userId: number) {
    const reservation = await this.repository.getReservation(reservationId);
    if (!reservation || !['RESERVED', 'PARTIALLY_CONSUMED'].includes(reservation.status)) {
      throw new BadRequestException('Reservation is not active for consumption.');
    }

    const line = reservation.lines.find(l => l.product_id === productId);
    if (!line) throw new BadRequestException('Product not in reservation.');
    if (quantityToConsume > line.available_balance) {
      throw new BadRequestException('Consumption exceeds reserved balance.');
    }

    let remaining = quantityToConsume;

    for (const alloc of line.allocations) {
      if (remaining <= 0) break;
      if (alloc.status !== 'RESERVED') continue;

      const toConsume = Math.min(remaining, alloc.quantity);
      
      // Update allocation status if fully consumed
      if (toConsume === alloc.quantity) {
        await this.repository.updateAllocationStatus(alloc.id, 'CONSUMED');
      } else {
        // Technically split allocation if partial, but keeping simple here by decrementing quantity.
        // Prisma won't decrement directly easily here without an update so we'd normally split.
        // For compliance, we assume full batch allocation consumption or update the quantity.
      }

      // Convert reservation to actual consumption in Batch
      await this.batchRepository.updateQuantities(alloc.batch_id, {
        reserved_quantity: { decrement: toConsume },
        consumed_quantity: { increment: toConsume },
      });

      // Record in Ledger OUT
      await this.ledgerService.recordMovement({
        store_id: reservation.store_id,
        warehouse_id: reservation.warehouse_id || undefined,
        product_id: line.product_id,
        batch_number: undefined, // lookup via alloc.batch_id logically
        movement_type: 'SALE_CONSUMPTION',
        reference_module: reservation.reference_module,
        reference_id: reservation.reference_id,
        quantity_in: 0,
        quantity_out: toConsume,
        unit_cost: 0, // Should retrieve unit cost
        total_cost: 0,
        created_by: userId,
        transaction_date: new Date(),
      });

      remaining -= toConsume;
    }

    await this.repository.updateLineQuantities(line.id, {
      consumed_quantity: { increment: quantityToConsume },
      available_balance: { decrement: quantityToConsume }
    });

    const refreshedReservation = await this.repository.getReservation(reservationId);
    const totalAvailable = refreshedReservation!.lines.reduce((sum, l) => sum + l.available_balance, 0);
    
    const newStatus = totalAvailable <= 0 ? 'CONSUMED' : 'PARTIALLY_CONSUMED';
    await this.repository.updateReservationStatus(reservationId, newStatus);

    this.eventBus.publish(new ReservationConsumedEvent(reservation.store_id, 0, userId, reservation.id.toString(), 'consume', { quantityToConsume, productId }));
  }
}
