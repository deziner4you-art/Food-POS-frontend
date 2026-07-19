import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StockCountRepository } from '../repositories/stock-count.repository';
import { StockCountValidator } from '../validators/stock-count.validator';
import { CreateStockCountDto, RecordPhysicalCountDto } from '../interfaces/stock-count.interface';
import { InventoryLedgerService } from './inventory-ledger.service';
import { InventoryValuationService } from './inventory-valuation.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { StockCountCompletedEvent } from '../events/stock-count-completed.event';

@Injectable()
export class StockCountService {
  private readonly logger = new Logger(StockCountService.name);

  constructor(
    private readonly repository: StockCountRepository,
    private readonly validator: StockCountValidator,
    private readonly ledgerService: InventoryLedgerService,
    private readonly valuationService: InventoryValuationService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async createSession(dto: CreateStockCountDto) {
    await this.validator.validateActiveSession(dto.store_id, dto.warehouse_id);

    const session = await this.repository.createSession({
      store_id: dto.store_id,
      warehouse_id: dto.warehouse_id,
      scheduled_date: dto.scheduled_date,
      remarks: dto.remarks,
      created_by: dto.created_by,
      status: 'COUNTING',
    });

    return session;
  }

  async recordCount(sessionId: number, dto: RecordPhysicalCountDto) {
    this.validator.validatePhysicalCount(dto.physical_quantity);
    
    const session = await this.repository.getSession(sessionId);
    if (!session || session.status !== 'COUNTING') {
      throw new BadRequestException('Session is not active for counting.');
    }

    // Freeze system quantity
    const balance = await this.ledgerService.getCurrentBalance(session.store_id, dto.product_id);
    const systemQuantity = balance.current_balance;
    const variance = dto.physical_quantity - systemQuantity;

    // Get Valuation (Unit Cost at the time of freeze)
    const valuation = await this.valuationService.calculateCost({
      store_id: session.store_id,
      warehouse_id: session.warehouse_id || 0,
      product_id: dto.product_id,
      movement_type: 'STOCK_ADJUSTMENT',
      quantity: 1, // evaluate 1 unit cost
      transaction_date: new Date(),
      method: 'WEIGHTED_AVERAGE', // default fallback
    }, session.created_by);

    await this.repository.createOrUpdateLine(
      sessionId,
      dto.product_id,
      systemQuantity,
      dto.physical_quantity,
      valuation.unit_cost,
      variance,
      dto.remarks
    );
  }

  async finishCounting(sessionId: number, userId: number) {
    const session = await this.repository.updateSessionStatus(sessionId, 'REVIEW');
    
    this.eventBus.publish(new StockCountCompletedEvent(
      session.store_id, 0, userId, sessionId.toString(), 'finishCounting', session
    ));

    return session;
  }
}
