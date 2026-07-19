const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/goods-receipt-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class GoodsReceiptPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'GOODS_RECEIPT_POSTED';
  occurred_at = new Date();
  entity_type = 'PURCHASING';

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
}
`,

  'events/supplier-invoice-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class SupplierInvoicePostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'SUPPLIER_INVOICE_POSTED';
  occurred_at = new Date();
  entity_type = 'PURCHASING';

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
}
`,

  'events/purchase-return-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class PurchaseReturnPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'PURCHASE_RETURN_POSTED';
  occurred_at = new Date();
  entity_type = 'PURCHASING';

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
}
`,

  // Interface Payload
  'interfaces/purchase-accounting.payload.ts': `export interface PurchaseItemPayload {
  item_id: number;
  quantity: number;
  unit_cost: number;
  tax: number;
  discount: number;
  total: number;
}

export interface PurchaseAccountingPayload {
  store_id: number;
  tenant_id?: number;
  warehouse_id: number;
  supplier_id: number;
  purchase_order_id?: string;
  grn_number?: string;
  invoice_number?: string;
  return_number?: string;
  currency_id?: number;
  items: PurchaseItemPayload[];
  total_amount: number;
  total_tax: number;
  total_discount: number;
  reference: string;
  created_by: number;
  transaction_date: Date;
}
`,

  // Mappers
  'mappers/goods-receipt.mapper.ts': `import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';
import { PurchaseAccountingPayload } from '../interfaces/purchase-accounting.payload';

@Injectable()
export class GoodsReceiptMapper {
  mapToAccountingRequest(payload: PurchaseAccountingPayload): AccountingRequest {
    return {
      tenant_id: payload.tenant_id || 0,
      store_id: payload.store_id,
      business_module: BusinessModule.INVENTORY,
      business_event: BusinessEvent.GOODS_RECEIPT,
      business_document_id: payload.grn_number || \`GRN-\${Date.now()}\`,
      document_number: payload.grn_number || \`GRN-\${Date.now()}\`,
      transaction_date: payload.transaction_date,
      user_id: payload.created_by,
      reference: payload.reference,
      currency_id: payload.currency_id,
      amount: payload.total_amount,
      tax_amount: payload.total_tax,
      metadata: {
        supplier_id: payload.supplier_id,
        warehouse_id: payload.warehouse_id,
        purchase_order_id: payload.purchase_order_id,
      }
    };
  }
}
`,

  'mappers/supplier-invoice.mapper.ts': `import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';
import { PurchaseAccountingPayload } from '../interfaces/purchase-accounting.payload';

@Injectable()
export class SupplierInvoiceMapper {
  mapToAccountingRequest(payload: PurchaseAccountingPayload): AccountingRequest {
    return {
      tenant_id: payload.tenant_id || 0,
      store_id: payload.store_id,
      business_module: BusinessModule.PURCHASING,
      business_event: BusinessEvent.PURCHASE_INVOICE,
      business_document_id: payload.invoice_number || \`INV-\${Date.now()}\`,
      document_number: payload.invoice_number || \`INV-\${Date.now()}\`,
      transaction_date: payload.transaction_date,
      user_id: payload.created_by,
      reference: payload.reference,
      currency_id: payload.currency_id,
      amount: payload.total_amount,
      tax_amount: payload.total_tax,
      metadata: {
        supplier_id: payload.supplier_id,
        purchase_order_id: payload.purchase_order_id,
      }
    };
  }
}
`,

  'mappers/purchase-return.mapper.ts': `import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';
import { PurchaseAccountingPayload } from '../interfaces/purchase-accounting.payload';

@Injectable()
export class PurchaseReturnMapper {
  mapToAccountingRequest(payload: PurchaseAccountingPayload): AccountingRequest {
    return {
      tenant_id: payload.tenant_id || 0,
      store_id: payload.store_id,
      business_module: BusinessModule.PURCHASING,
      business_event: BusinessEvent.PURCHASE_RETURN,
      business_document_id: payload.return_number || \`RET-\${Date.now()}\`,
      document_number: payload.return_number || \`RET-\${Date.now()}\`,
      transaction_date: payload.transaction_date,
      user_id: payload.created_by,
      reference: payload.reference,
      currency_id: payload.currency_id,
      amount: payload.total_amount,
      tax_amount: payload.total_tax,
      metadata: {
        supplier_id: payload.supplier_id,
        purchase_order_id: payload.purchase_order_id,
      }
    };
  }
}
`,

  // Validators
  'validators/purchase-accounting.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PurchaseAccountingPayload } from '../interfaces/purchase-accounting.payload';

@Injectable()
export class PurchaseAccountingValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validatePayload(payload: PurchaseAccountingPayload) {
    if (payload.total_amount <= 0) {
      throw new BadRequestException(\`Invalid amount (\${payload.total_amount}) for purchasing transaction\`);
    }

    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('No items specified in the purchasing payload.');
    }

    for (const item of payload.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(\`Item \${item.item_id} has invalid quantity: \${item.quantity}\`);
      }
      if (item.unit_cost < 0) {
        throw new BadRequestException(\`Item \${item.item_id} has invalid unit cost: \${item.unit_cost}\`);
      }
    }

    // Checking duplicates requires a unique reference. For Purchasing, we can query by reference or document number.
    // The integration service maps the reference to the voucher reference.
    const duplicate = await this.prisma.voucher.findFirst({
      where: {
        store_id: payload.store_id,
        reference_number: payload.reference,
      }
    });

    if (duplicate) {
      throw new BadRequestException(\`Duplicate transaction: Accounting entry for \${payload.reference} already exists.\`);
    }
  }
}
`,

  // Integration Engine
  'integrations/purchase-accounting.integration.ts': `import { Injectable, Logger } from '@nestjs/common';
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
    this.logger.log(\`Initiating Goods Receipt Integration for \${payload.grn_number}\`);
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
    this.logger.log(\`Initiating Supplier Invoice Integration for \${payload.invoice_number}\`);
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
    this.logger.log(\`Initiating Purchase Return Integration for \${payload.return_number}\`);
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
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
