import { Module } from '@nestjs/common';
import { OnlineOrdersService } from './online-orders.service';
import { OnlineOrdersController } from './online-orders.controller';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { AppGateway } from '../../../app.gateway';
import { PricingService } from '../pos-orders/pricing.service';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [PrismaModule, CustomersModule],
  controllers: [OnlineOrdersController],
  providers: [OnlineOrdersService, AppGateway, PricingService],
})
export class OnlineOrdersModule {}
