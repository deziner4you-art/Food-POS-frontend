import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductionRepository } from '../repositories/production.repository';
import { ProductionValidator } from '../validators/production.validator';
import { CreateProductionOrderDto } from '../interfaces/production-order.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { ProductionOrderCreatedEvent } from '../events/production-order-created.event';
import { InventoryReservationService } from './inventory-reservation.service';
import { ReservationAllocationService } from './reservation-allocation.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ProductionOrderService {
  private readonly logger = new Logger(ProductionOrderService.name);

  constructor(
    private readonly repository: ProductionRepository,
    private readonly validator: ProductionValidator,
    private readonly eventBus: DomainEventBusService,
    private readonly reservationService: InventoryReservationService,
    private readonly allocationService: ReservationAllocationService,
  ) {}

  async createOrder(dto: CreateProductionOrderDto) {
    const product = await this.validator.validateNewOrder(dto.production_number, dto.target_product_id);

    // Create Reservation
    const reservationNumber = `RES-PROD-${dto.production_number}`;
    const reservation = await this.reservationService.createDraft({
      reservation_number: reservationNumber,
      source: 'MANUAL',
      reference_module: 'PRODUCTION_ORDER',
      reference_id: dto.production_number,
      store_id: dto.store_id,
      warehouse_id: dto.warehouse_id,
      created_by: dto.created_by,
    });

    const order = await this.repository.createOrder({
      production_number: dto.production_number,
      production_type: dto.production_type,
      target_product_id: dto.target_product_id,
      store_id: dto.store_id,
      warehouse_id: dto.warehouse_id,
      kitchen_id: dto.kitchen_id,
      planned_quantity: dto.planned_quantity,
      remarks: dto.remarks,
      created_by: dto.created_by,
      status: 'DRAFT',
      reservation_id: reservation.id,
    });

    // Extract recipe and reserve
    for (const recipeItem of product.recipeItems) {
      const requiredQty = recipeItem.quantity * dto.planned_quantity;
      await this.repository.addLine({
        production_id: order.id,
        product_id: recipeItem.inventory_id,
        planned_quantity: requiredQty,
      });

      await this.reservationService.addLine(reservation.id, {
        product_id: recipeItem.inventory_id,
        reserved_quantity: requiredQty,
      });
    }

    await this.allocationService.reserve(reservation.id, dto.created_by);

    await this.repository.updateOrderStatus(order.id, 'RELEASED');
    this.eventBus.publish(new ProductionOrderCreatedEvent(dto.store_id, 0, dto.created_by, order.id.toString(), 'createProductionOrder', order));

    return order;
  }
}
