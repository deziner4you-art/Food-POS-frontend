import { Injectable, Logger } from '@nestjs/common';
import { ProductionRepository } from '../repositories/production.repository';
import { ReservationAllocationService } from './reservation-allocation.service';
import { InventoryValuationService } from './inventory-valuation.service';
import { AccountingIntegrationService } from './accounting-integration.service';
import { BusinessModule } from '../enums/business-module.enum';
import { BusinessEvent } from '../enums/business-event.enum';

@Injectable()
export class ProductionConsumptionService {
  private readonly logger = new Logger(ProductionConsumptionService.name);

  constructor(
    private readonly repository: ProductionRepository,
    private readonly allocationService: ReservationAllocationService,
    private readonly valuationService: InventoryValuationService,
    private readonly accountingIntegration: AccountingIntegrationService,
  ) {}

  async consumeLine(order: any, line: any, quantityToConsume: number, userId: number): Promise<number> {
    if (quantityToConsume <= 0) return 0;

    // 1. Consume from Reservation (which automatically impacts Ledger OUT)
    if (order.reservation_id) {
      await this.allocationService.consume(order.reservation_id, quantityToConsume, line.product_id, userId);
    }

    // 2. Valuation
    const valuation = await this.valuationService.calculateCost({
      store_id: order.store_id,
      warehouse_id: order.warehouse_id || 0,
      product_id: line.product_id,
      movement_type: 'CONSUMPTION',
      quantity: quantityToConsume,
      transaction_date: new Date(),
      method: 'WEIGHTED_AVERAGE',
    }, userId);

    // 3. Record internal consumption
    await this.repository.addConsumption({
      production_id: order.id,
      product_id: line.product_id,
      quantity: quantityToConsume,
      unit_cost: valuation.unit_cost,
      total_cost: valuation.total_cost,
    });

    await this.repository.updateLineQuantities(line.id, {
      consumed_quantity: { increment: quantityToConsume }
    });

    // 4. Accounting Integration
    await this.accountingIntegration.processBusinessEvent({
      tenant_id: 0,
      store_id: order.store_id,
      business_module: BusinessModule.INVENTORY,
      business_event: 'PRODUCTION_CONSUMPTION' as any, // Mapped locally
      business_document_id: order.production_number,
      document_number: order.production_number,
      transaction_date: new Date(),
      user_id: userId,
      reference: `Production Consumption: ${order.production_number}`,
      amount: valuation.total_cost,
    });

    return valuation.total_cost;
  }
}
