import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InventoryReservationRepository } from '../repositories/inventory-reservation.repository';
import { InventoryReservationValidator } from '../validators/inventory-reservation.validator';
import { CreateReservationDto, AddReservationLineDto } from '../interfaces/inventory-reservation.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';

@Injectable()
export class InventoryReservationService {
  private readonly logger = new Logger(InventoryReservationService.name);

  constructor(
    private readonly repository: InventoryReservationRepository,
    private readonly validator: InventoryReservationValidator,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async createDraft(dto: CreateReservationDto) {
    await this.validator.validateNewReservation(dto.reservation_number, dto.expiry_date);

    return this.repository.createReservation({
      reservation_number: dto.reservation_number,
      source: dto.source,
      reference_module: dto.reference_module,
      reference_id: dto.reference_id,
      store_id: dto.store_id,
      warehouse_id: dto.warehouse_id,
      expiry_date: dto.expiry_date,
      remarks: dto.remarks,
      created_by: dto.created_by,
      status: 'DRAFT',
    });
  }

  async addLine(reservationId: number, dto: AddReservationLineDto) {
    const reservation = await this.repository.getReservation(reservationId);
    if (!reservation || reservation.status !== 'DRAFT') {
      throw new BadRequestException('Reservation is not open for adding lines.');
    }

    await this.validator.validateReservationLine(reservation.store_id, dto.product_id, dto.reserved_quantity, reservation.warehouse_id || undefined);

    await this.repository.addLine({
      reservation_id: reservationId,
      product_id: dto.product_id,
      reserved_quantity: dto.reserved_quantity,
      available_balance: dto.reserved_quantity,
    });
  }
}
