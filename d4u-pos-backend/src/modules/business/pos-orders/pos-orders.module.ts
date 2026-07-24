import { Module } from '@nestjs/common';
import { PosOrdersController } from './pos-orders.controller';
import { PosOrdersService } from './pos-orders.service';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { AppGateway } from '../../../app.gateway';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';

import { PricingService } from './pricing.service';

@Module({
  imports: [PrismaModule, InventoryModule, CustomersModule],
  controllers: [PosOrdersController],
  providers: [PosOrdersService, AppGateway, PricingService],
  exports: [PosOrdersService, PricingService],
})
export class PosOrdersModule {}
