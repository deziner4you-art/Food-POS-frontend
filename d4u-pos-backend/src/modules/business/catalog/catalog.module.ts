import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { ModifierService } from './modifier.service';
import { ModifierController } from './modifier.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { CategoryGroupService } from './category-group.service';
import { CategoryGroupController } from './category-group.controller';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { PricingService } from '../pos-orders/pricing.service';

// PricingService is provided directly here (not imported via PosOrdersModule)
// — its own deps (SubscriptionService, CampaignResolverService) are both
// @Global(), so this mirrors the established pattern documented in those
// modules rather than introducing a cross-module import.
@Module({
  imports: [PrismaModule],
  providers: [CatalogService, ModifierService, AvailabilityService, CategoryGroupService, PricingService],
  controllers: [CatalogController, ModifierController, AvailabilityController, CategoryGroupController],
  exports: [CatalogService, CategoryGroupService],
})
export class CatalogModule {}
