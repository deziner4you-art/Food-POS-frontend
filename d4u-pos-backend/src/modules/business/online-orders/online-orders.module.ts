import { Module } from '@nestjs/common';
import { OnlineOrdersService } from './online-orders.service';
import { OnlineOrdersController } from './online-orders.controller';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { AppGateway } from '../../../app.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [OnlineOrdersController],
  providers: [OnlineOrdersService, AppGateway],
})
export class OnlineOrdersModule {}
