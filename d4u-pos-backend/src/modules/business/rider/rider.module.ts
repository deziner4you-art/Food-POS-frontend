import { Module } from '@nestjs/common';
import { RiderService } from './rider.service';
import {
  RiderController,
  RiderOrdersController,
} from './rider.controller';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { AppGateway } from '../../../app.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [
    RiderController,
    RiderOrdersController,
  ],
  providers: [RiderService, AppGateway],
})
export class RiderModule {}
