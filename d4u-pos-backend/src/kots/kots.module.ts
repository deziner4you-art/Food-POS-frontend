import { Module } from '@nestjs/common';
import { KotsController } from './kots.controller';
import { KotsService } from './kots.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppGateway } from '../app.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [KotsController],
  providers: [KotsService, AppGateway],
  exports: [KotsService],
})
export class KotsModule {}
