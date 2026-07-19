import { Injectable, Logger } from '@nestjs/common';
import { Order } from '@prisma/client';
import { PosSaleMapper } from '../mappers/pos-sale.mapper';
import { PosRefundMapper } from '../mappers/pos-refund.mapper';
import { PosAccountingValidator } from '../validators/pos-accounting.validator';
import { AccountingIntegrationService } from '../services/accounting-integration.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { POSSalePostedEvent } from '../events/pos-sale-posted.event';
import { POSRefundPostedEvent } from '../events/pos-refund-posted.event';
import { POSVoidPostedEvent } from '../events/pos-void-posted.event';

@Injectable()
export class PosAccountingIntegration {
  private readonly logger = new Logger(PosAccountingIntegration.name);

  constructor(
    private readonly validator: PosAccountingValidator,
    private readonly saleMapper: PosSaleMapper,
    private readonly refundMapper: PosRefundMapper,
    private readonly accountingIntegration: AccountingIntegrationService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async postSale(order: Order, taxAmount: number = 0) {
    this.logger.log(`Initiating accounting integration for POS Sale Order ${order.id}`);
    
    // 1. Validate
    await this.validator.validateSale(order);

    // 2. Map
    const request = this.saleMapper.mapOrderToAccountingRequest(order, taxAmount);

    // Payment methods resolve through Accounting Rules. 
    // We explicitly modify the trigger event to allow the rules engine to differentiate routes (e.g. POS_SALE_CASH vs POS_SALE_CARD)
    request.business_event = `POS_SALE_${order.payment_method.toUpperCase()}`;

    // 3. Process
    const response = await this.accountingIntegration.processBusinessEvent(request);

    if (response.success) {
      // 4. Event
      this.eventBus.publish(new POSSalePostedEvent(
        order.store_id, 0, order.created_by, order.id.toString(), 'postSale', response
      ));
    }

    return response;
  }

  async postRefund(order: Order, refundAmount: number, taxRefund: number = 0) {
    this.logger.log(`Initiating accounting integration for POS Refund Order ${order.id}`);
    
    await this.validator.validateRefund(order);
    const request = this.refundMapper.mapRefundToAccountingRequest(order, refundAmount, taxRefund);
    request.business_event = `POS_REFUND_${order.payment_method.toUpperCase()}`;

    const response = await this.accountingIntegration.processBusinessEvent(request);

    if (response.success) {
      this.eventBus.publish(new POSRefundPostedEvent(
        order.store_id, 0, order.created_by, order.id.toString(), 'postRefund', response
      ));
    }
    return response;
  }

  async postVoid(order: Order) {
    this.logger.log(`Initiating accounting integration for POS Void Order ${order.id}`);
    
    await this.validator.validateVoid(order);
    
    const request = this.saleMapper.mapOrderToAccountingRequest(order, 0);
    request.business_event = `POS_VOID_${order.payment_method.toUpperCase()}`;
    
    const response = await this.accountingIntegration.processBusinessEvent(request);

    if (response.success) {
      this.eventBus.publish(new POSVoidPostedEvent(
        order.store_id, 0, order.void_approved_by || order.created_by, order.id.toString(), 'postVoid', response
      ));
    }
    return response;
  }
}
