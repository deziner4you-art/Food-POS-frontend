import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionCron } from './subscription.cron';
import { PrismaModule } from '../../../database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SubscriptionService, SubscriptionCron],
  controllers: [SubscriptionController]
})
export class SubscriptionModule {}
