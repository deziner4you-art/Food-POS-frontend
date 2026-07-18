import { Module } from '@nestjs/common';
import { RiderService } from './rider.service';
import { RiderController, RiderOrdersController, DispatchOrderController, SettleOrderController } from './rider.controller';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { AppGateway } from '../../../app.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [RiderController, RiderOrdersController, DispatchOrderController, SettleOrderController],
  providers: [RiderService, AppGateway]
})
export class RiderModule {}
