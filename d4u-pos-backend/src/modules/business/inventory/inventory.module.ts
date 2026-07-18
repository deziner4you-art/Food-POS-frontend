import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '../../../database/prisma/prisma.module';

import { AppGateway } from '../../../app.gateway';

@Module({
  imports: [PrismaModule],
  providers: [InventoryService, AppGateway],
  controllers: [InventoryController],
  exports: [InventoryService]
})
export class InventoryModule {}
