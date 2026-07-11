import { Module } from '@nestjs/common';
import { PosOrdersController } from './pos-orders.controller';
import { PosOrdersService } from './pos-orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppGateway } from '../app.gateway';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [PrismaModule, InventoryModule, CustomersModule],
  controllers: [PosOrdersController],
  providers: [PosOrdersService, AppGateway],
  exports: [PosOrdersService],
})
export class PosOrdersModule {}
