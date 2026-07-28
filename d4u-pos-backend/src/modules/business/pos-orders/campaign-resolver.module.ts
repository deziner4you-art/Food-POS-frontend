import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { CampaignResolverService } from './campaign-resolver.service';

// @Global() — several modules (PosOrdersModule, OnlineOrdersModule, ...) each
// provide their own PricingService instance directly rather than importing a
// shared module (pre-existing pattern, see SubscriptionModule's identical
// note). Making the resolver global means every one of those PricingService
// instances can depend on it without each module needing to import this one.
@Global()
@Module({
  imports: [PrismaModule],
  providers: [CampaignResolverService],
  exports: [CampaignResolverService],
})
export class CampaignResolverModule {}
