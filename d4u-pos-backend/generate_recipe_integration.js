const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/recipe-consumed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class RecipeConsumedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'RECIPE_CONSUMED';
  occurred_at = new Date();
  entity_type = 'RECIPE_CONSUMPTION';

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

  'events/cogs-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class COGSPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'COGS_POSTED';
  occurred_at = new Date();
  entity_type = 'ACCOUNTING_POSTING';

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

  'events/inventory-consumption-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class InventoryConsumptionPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'INVENTORY_CONSUMPTION_POSTED';
  occurred_at = new Date();
  entity_type = 'ACCOUNTING_POSTING';

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

  // Payload Interfaces
  'interfaces/recipe-consumption.payload.ts': `export interface RecipeIngredientConsumption {
  inventory_id: number;
  consumed_quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface RecipeConsumptionPayload {
  store_id: number;
  kitchen_id?: number;
  product_id: number;
  order_id: number;
  transaction_date: Date;
  created_by: number;
  ingredients: RecipeIngredientConsumption[];
  total_cogs: number;
}
`,

  // Mappers
  'mappers/recipe-consumption.mapper.ts': `import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';
import { RecipeConsumptionPayload } from '../interfaces/recipe-consumption.payload';

@Injectable()
export class RecipeConsumptionMapper {
  mapConsumptionToAccountingRequest(payload: RecipeConsumptionPayload): AccountingRequest {
    return {
      tenant_id: 0,
      store_id: payload.store_id,
      business_module: BusinessModule.INVENTORY,
      business_event: BusinessEvent.INVENTORY_CONSUMPTION,
      business_document_id: \`ORD-\${payload.order_id}-PROD-\${payload.product_id}\`,
      document_number: \`ICNS-\${payload.order_id}-\${payload.product_id}\`,
      transaction_date: payload.transaction_date,
      user_id: payload.created_by,
      reference: \`Recipe Consumption for Order \${payload.order_id}, Product \${payload.product_id}\`,
      amount: payload.total_cogs,
      metadata: {
        order_id: payload.order_id,
        product_id: payload.product_id,
        ingredients_count: payload.ingredients.length,
      }
    };
  }
}
`,

  'mappers/cogs.mapper.ts': `import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';
import { RecipeConsumptionPayload } from '../interfaces/recipe-consumption.payload';

@Injectable()
export class COGSMapper {
  mapCOGSToAccountingRequest(payload: RecipeConsumptionPayload): AccountingRequest {
    return {
      tenant_id: 0,
      store_id: payload.store_id,
      business_module: BusinessModule.ACCOUNTING,
      business_event: 'COGS_POSTING' as any, // Mapped locally if not in enum
      business_document_id: \`ORD-\${payload.order_id}-COGS\`,
      document_number: \`COGS-\${payload.order_id}-\${payload.product_id}\`,
      transaction_date: payload.transaction_date,
      user_id: payload.created_by,
      reference: \`COGS Posting for Order \${payload.order_id}, Product \${payload.product_id}\`,
      amount: payload.total_cogs,
      metadata: {
        order_id: payload.order_id,
        product_id: payload.product_id,
      }
    };
  }
}
`,

  // Validators
  'validators/recipe-accounting.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { RecipeConsumptionPayload } from '../interfaces/recipe-consumption.payload';

@Injectable()
export class RecipeAccountingValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateConsumption(payload: RecipeConsumptionPayload) {
    if (payload.total_cogs <= 0) {
      throw new BadRequestException(\`Invalid COGS amount (\${payload.total_cogs}) for Order \${payload.order_id}\`);
    }

    if (!payload.ingredients || payload.ingredients.length === 0) {
      throw new BadRequestException(\`No ingredients specified for consumption in Order \${payload.order_id}\`);
    }

    // Check Duplicate
    const reference = \`Recipe Consumption for Order \${payload.order_id}, Product \${payload.product_id}\`;
    const duplicate = await this.prisma.voucher.findFirst({
      where: {
        store_id: payload.store_id,
        reference_number: reference,
      }
    });

    if (duplicate) {
      throw new BadRequestException(\`Consumption for Order \${payload.order_id}, Product \${payload.product_id} already posted.\`);
    }
  }
}
`,

  // Integration
  'integrations/recipe-accounting.integration.ts': `import { Injectable, Logger } from '@nestjs/common';
import { RecipeConsumptionPayload } from '../interfaces/recipe-consumption.payload';
import { RecipeConsumptionMapper } from '../mappers/recipe-consumption.mapper';
import { RecipeAccountingValidator } from '../validators/recipe-accounting.validator';
import { AccountingIntegrationService } from '../services/accounting-integration.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { RecipeConsumedEvent } from '../events/recipe-consumed.event';
import { InventoryConsumptionPostedEvent } from '../events/inventory-consumption-posted.event';

@Injectable()
export class RecipeAccountingIntegration {
  private readonly logger = new Logger(RecipeAccountingIntegration.name);

  constructor(
    private readonly validator: RecipeAccountingValidator,
    private readonly consumptionMapper: RecipeConsumptionMapper,
    private readonly accountingIntegration: AccountingIntegrationService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async postRecipeConsumption(payload: RecipeConsumptionPayload) {
    this.logger.log(\`Initiating accounting integration for Recipe Consumption (Order \${payload.order_id})\`);
    
    // 1. Validate
    await this.validator.validateConsumption(payload);

    // 2. Map Request
    // Maps to INVENTORY_CONSUMPTION event (Debit: COGS, Credit: Inventory)
    const request = this.consumptionMapper.mapConsumptionToAccountingRequest(payload);

    // 3. Process Integration
    const response = await this.accountingIntegration.processBusinessEvent(request);

    if (response.success) {
      // 4. Publish Events
      this.eventBus.publish(new RecipeConsumedEvent(
        payload.store_id, 0, payload.created_by, \`\${payload.order_id}-\${payload.product_id}\`, 'postRecipeConsumption', payload
      ));

      this.eventBus.publish(new InventoryConsumptionPostedEvent(
        payload.store_id, 0, payload.created_by, \`\${payload.order_id}-\${payload.product_id}\`, 'postRecipeConsumption', response
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
