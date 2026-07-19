const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/pos-sale-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { EVENT_REGISTRY } from './event-registry';
import { randomUUID } from 'crypto';

export class POSSalePostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'POS_SALE_POSTED';
  occurred_at = new Date();
  entity_type = 'ORDER';

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

  'events/pos-refund-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class POSRefundPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'POS_REFUND_POSTED';
  occurred_at = new Date();
  entity_type = 'ORDER';

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

  'events/pos-void-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class POSVoidPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'POS_VOID_POSTED';
  occurred_at = new Date();
  entity_type = 'ORDER';

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

  // Mappers
  'mappers/pos-sale.mapper.ts': `import { Injectable } from '@nestjs/common';
import { Order } from '@prisma/client';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';

@Injectable()
export class PosSaleMapper {
  mapOrderToAccountingRequest(order: Order, taxAmount: number = 0): AccountingRequest {
    return {
      tenant_id: 0,
      store_id: order.store_id,
      business_module: BusinessModule.POS,
      business_event: BusinessEvent.POS_SALE,
      business_document_id: order.id.toString(),
      document_number: \`ORD-\${order.id}\`,
      transaction_date: order.business_date,
      user_id: order.created_by,
      reference: \`POS Sale Order \${order.id} via \${order.payment_method}\`,
      amount: order.total_amount,
      tax_amount: taxAmount,
      metadata: {
        payment_method: order.payment_method,
        discount: order.discount,
        customer_id: order.customer_id,
      }
    };
  }
}
`,

  'mappers/pos-refund.mapper.ts': `import { Injectable } from '@nestjs/common';
import { Order } from '@prisma/client';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';

@Injectable()
export class PosRefundMapper {
  mapRefundToAccountingRequest(order: Order, refundAmount: number, taxRefund: number = 0): AccountingRequest {
    return {
      tenant_id: 0,
      store_id: order.store_id,
      business_module: BusinessModule.POS,
      business_event: BusinessEvent.POS_REFUND,
      business_document_id: order.id.toString(),
      document_number: \`RFD-\${order.id}\`,
      transaction_date: new Date(), // Refund happens now
      user_id: order.created_by,
      reference: \`POS Refund Order \${order.id} via \${order.payment_method}\`,
      amount: refundAmount,
      tax_amount: taxRefund,
      metadata: {
        payment_method: order.payment_method,
      }
    };
  }
}
`,

  // Validators
  'validators/pos-accounting.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { Order } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class PosAccountingValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateSale(order: Order) {
    if (order.status !== 'SETTLED') {
      throw new BadRequestException(\`Order \${order.id} is not SETTLED. Accounting rejected.\`);
    }

    if (order.total_amount <= 0) {
      throw new BadRequestException(\`Order \${order.id} has invalid amount: \${order.total_amount}\`);
    }

    const reference = \`POS Sale Order \${order.id} via \${order.payment_method}\`;
    const duplicate = await this.prisma.voucher.findFirst({
      where: {
        store_id: order.store_id,
        reference_number: reference,
      }
    });

    if (duplicate) {
      throw new BadRequestException(\`Order \${order.id} already posted to accounting.\`);
    }
  }

  async validateRefund(order: Order) {
    if (order.status !== 'SETTLED' && order.status !== 'VOIDED') {
      throw new BadRequestException(\`Order \${order.id} cannot be refunded in status: \${order.status}\`);
    }
  }

  async validateVoid(order: Order) {
    if (order.status !== 'VOIDED') {
      throw new BadRequestException(\`Order \${order.id} is not VOIDED.\`);
    }
  }
}
`,

  // Integrations
  'integrations/pos-accounting.integration.ts': `import { Injectable, Logger } from '@nestjs/common';
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
    this.logger.log(\`Initiating accounting integration for POS Sale Order \${order.id}\`);
    
    // 1. Validate
    await this.validator.validateSale(order);

    // 2. Map
    const request = this.saleMapper.mapOrderToAccountingRequest(order, taxAmount);

    // Payment methods resolve through Accounting Rules. 
    // We explicitly modify the trigger event to allow the rules engine to differentiate routes (e.g. POS_SALE_CASH vs POS_SALE_CARD)
    request.business_event = \`POS_SALE_\${order.payment_method.toUpperCase()}\`;

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
    this.logger.log(\`Initiating accounting integration for POS Refund Order \${order.id}\`);
    
    await this.validator.validateRefund(order);
    const request = this.refundMapper.mapRefundToAccountingRequest(order, refundAmount, taxRefund);
    request.business_event = \`POS_REFUND_\${order.payment_method.toUpperCase()}\`;

    const response = await this.accountingIntegration.processBusinessEvent(request);

    if (response.success) {
      this.eventBus.publish(new POSRefundPostedEvent(
        order.store_id, 0, order.created_by, order.id.toString(), 'postRefund', response
      ));
    }
    return response;
  }

  async postVoid(order: Order) {
    this.logger.log(\`Initiating accounting integration for POS Void Order \${order.id}\`);
    
    await this.validator.validateVoid(order);
    
    const request = this.saleMapper.mapOrderToAccountingRequest(order, 0);
    request.business_event = \`POS_VOID_\${order.payment_method.toUpperCase()}\`;
    
    const response = await this.accountingIntegration.processBusinessEvent(request);

    if (response.success) {
      this.eventBus.publish(new POSVoidPostedEvent(
        order.store_id, 0, order.void_approved_by || order.created_by, order.id.toString(), 'postVoid', response
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
