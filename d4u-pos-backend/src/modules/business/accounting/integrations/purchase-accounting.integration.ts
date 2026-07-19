import { Injectable, Logger } from '@nestjs/common';
import { PurchaseAccountingPayload } from '../interfaces/purchase-accounting.payload';
import { GoodsReceiptMapper } from '../mappers/goods-receipt.mapper';
import { SupplierInvoiceMapper } from '../mappers/supplier-invoice.mapper';
import { PurchaseReturnMapper } from '../mappers/purchase-return.mapper';
import { PurchaseAccountingValidator } from '../validators/purchase-accounting.validator';
import { AccountingIntegrationService } from '../services/accounting-integration.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { GoodsReceiptPostedEvent } from '../events/goods-receipt-posted.event';
import { SupplierInvoicePostedEvent } from '../events/supplier-invoice-posted.event';
import { PurchaseReturnPostedEvent } from '../events/purchase-return-posted.event';

@Injectable()
export class PurchaseAccountingIntegration {
  private readonly logger = new Logger(PurchaseAccountingIntegration.name);

  constructor(
    private readonly validator: PurchaseAccountingValidator,
    private readonly grnMapper: GoodsReceiptMapper,
    private readonly invoiceMapper: SupplierInvoiceMapper,
    private readonly returnMapper: PurchaseReturnMapper,
    private readonly accountingIntegration: AccountingIntegrationService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async postGoodsReceipt(payload: PurchaseAccountingPayload) {
    this.logger.log(`Initiating Goods Receipt Integration for ${payload.grn_number}`);
    await this.validator.validatePayload(payload);

    const request = this.grnMapper.mapToAccountingRequest(payload);
    const response = await this.accountingIntegration.processBusinessEvent(request);

    if (response.success) {
      this.eventBus.publish(new GoodsReceiptPostedEvent(
        payload.store_id, payload.tenant_id || 0, payload.created_by, payload.grn_number || '', 'postGoodsReceipt', response
      ));
    }
    return response;
  }

  async postSupplierInvoice(payload: PurchaseAccountingPayload) {
    this.logger.log(`Initiating Supplier Invoice Integration for ${payload.invoice_number}`);
    await this.validator.validatePayload(payload);

    const request = this.invoiceMapper.mapToAccountingRequest(payload);
    const response = await this.accountingIntegration.processBusinessEvent(request);

    if (response.success) {
      this.eventBus.publish(new SupplierInvoicePostedEvent(
        payload.store_id, payload.tenant_id || 0, payload.created_by, payload.invoice_number || '', 'postSupplierInvoice', response
      ));
    }
    return response;
  }

  async postPurchaseReturn(payload: PurchaseAccountingPayload) {
    this.logger.log(`Initiating Purchase Return Integration for ${payload.return_number}`);
    await this.validator.validatePayload(payload);

    const request = this.returnMapper.mapToAccountingRequest(payload);
    const response = await this.accountingIntegration.processBusinessEvent(request);

    if (response.success) {
      this.eventBus.publish(new PurchaseReturnPostedEvent(
        payload.store_id, payload.tenant_id || 0, payload.created_by, payload.return_number || '', 'postPurchaseReturn', response
      ));
    }
    return response;
  }
}
