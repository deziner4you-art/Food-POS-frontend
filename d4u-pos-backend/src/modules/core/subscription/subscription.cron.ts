import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class SubscriptionCron {
  private readonly logger = new Logger(SubscriptionCron.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredSubscriptions() {
    this.logger.log('Running daily subscription expiration check...');
    
    const now = new Date();
    
    // Find active subscriptions that have passed their expiry date
    const expiredSubs = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        expiry_date: {
          lt: now
        }
      },
      include: { brand: true }
    });

    for (const sub of expiredSubs) {
      this.logger.log(`Suspending expired subscription for Brand: ${sub.brand.name} (ID: ${sub.brand_id})`);
      
      await this.prisma.$transaction([
        this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'SUSPENDED',
            suspend_reason: 'Subscription expired. Please renew to continue using services.'
          }
        }),
        this.prisma.billingHistory.create({
          data: {
            subscription_id: sub.id,
            event_type: 'SUSPENDED',
            description: 'Automatic suspension due to expired subscription.'
          }
        })
      ]);
    }
    
    this.logger.log(`Suspended ${expiredSubs.length} expired subscriptions.`);
  }
}
