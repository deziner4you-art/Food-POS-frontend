import { Module } from '@nestjs/common';
import { PosOrdersController } from './pos-orders.controller';
import { PosOrdersService } from './pos-orders.service';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { AppGateway } from '../../../app.gateway';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';
import { TablesModule } from '../tables/tables.module';
import { SubscriptionModule } from '../../core/subscription/subscription.module';
import { CampaignResolverModule } from './campaign-resolver.module';

import { PricingService } from './pricing.service';
import { PromotionEngine } from './promotion-engine.service';

@Module({
  imports: [PrismaModule, InventoryModule, CustomersModule, TablesModule, SubscriptionModule, CampaignResolverModule],
  controllers: [PosOrdersController],
  providers: [PosOrdersService, AppGateway, PricingService, PromotionEngine],
  exports: [PosOrdersService, PricingService, PromotionEngine],
})
export class PosOrdersModule {}
