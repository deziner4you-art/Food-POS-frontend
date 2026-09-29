import { Module } from '@nestjs/common';
import { RiderService } from './rider.service';
import {
  RiderController,
  RiderOrdersController,
} from './rider.controller';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { AppGateway } from '../../../app.gateway';
import { TablesModule } from '../tables/tables.module';

@Module({
  imports: [PrismaModule, TablesModule],
  controllers: [
    RiderController,
    RiderOrdersController,
  ],
  providers: [RiderService, AppGateway],
})
export class RiderModule {}
