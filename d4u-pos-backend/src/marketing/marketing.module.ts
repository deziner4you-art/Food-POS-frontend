import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';

@Module({
  imports: [PrismaModule],
  providers: [MarketingService],
  controllers: [MarketingController]
})
export class MarketingModule {}
