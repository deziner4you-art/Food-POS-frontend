import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InventoryReservationRepository } from '../repositories/inventory-reservation.repository';
import { BatchRepository } from '../repositories/batch.repository';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { ReservationReleasedEvent } from '../events/reservation-released.event';
import { ReservationExpiredEvent } from '../events/reservation-expired.event';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ReservationReleaseService {
  private readonly logger = new Logger(ReservationReleaseService.name);

  constructor(
    private readonly repository: InventoryReservationRepository,
    private readonly batchRepository: BatchRepository,
    private readonly eventBus: DomainEventBusService,
    private readonly prisma: PrismaService,
  ) {}

  async release(reservationId: number, userId: number) {
    const reservation = await this.repository.getReservation(reservationId);
    if (!reservation || !['RESERVED', 'PARTIALLY_CONSUMED'].includes(reservation.status)) {
      throw new BadRequestException('Reservation cannot be released.');
    }

    for (const line of reservation.lines) {
      if (line.available_balance <= 0) continue;

      for (const alloc of line.allocations) {
        if (alloc.status !== 'RESERVED') continue;

        // Restore to batch
        await this.batchRepository.updateQuantities(alloc.batch_id, {
          reserved_quantity: { decrement: alloc.quantity },
          available_quantity: { increment: alloc.quantity },
        });

        await this.repository.updateAllocationStatus(alloc.id, 'RELEASED');
      }

      await this.repository.updateLineQuantities(line.id, {
        released_quantity: { increment: line.available_balance },
        available_balance: 0,
      });
    }

    await this.repository.updateReservationStatus(reservationId, 'RELEASED');
    this.eventBus.publish(new ReservationReleasedEvent(reservation.store_id, 0, userId, reservation.id.toString(), 'release', {}));
  }

  async scanExpiries(storeId: number) {
    this.logger.log('Scanning for expired reservations');
    const now = new Date();

    const expiredReservations = await this.prisma.inventoryReservation.findMany({
      where: { store_id: storeId, status: { in: ['RESERVED', 'PARTIALLY_CONSUMED'] }, expiry_date: { lte: now } }
    });

    for (const reservation of expiredReservations) {
      await this.release(reservation.id, 0); // System user
      await this.repository.updateReservationStatus(reservation.id, 'EXPIRED');
      this.eventBus.publish(new ReservationExpiredEvent(reservation.store_id, 0, 0, reservation.id.toString(), 'expire', {}));
    }
  }
}
