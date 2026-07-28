import { Global, Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionCron } from './subscription.cron';
import { PrismaModule } from '../../../database/prisma/prisma.module';

// @Global() — PricingService now depends on SubscriptionService, and several
// modules (PosOrdersModule, OnlineOrdersModule, ...) each provide their own
// PricingService instance directly (pre-existing pattern, see TerminalModule's
// identical note). Making SubscriptionModule global avoids having to import
// it into every one of those modules individually.
@Global()
@Module({
  imports: [PrismaModule],
  providers: [SubscriptionService, SubscriptionCron],
  controllers: [SubscriptionController],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
