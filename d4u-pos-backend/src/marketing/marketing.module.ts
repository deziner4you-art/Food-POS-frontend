import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';

@Module({
  imports: [PrismaModule],
  providers: [MarketingService, SocialService],
  controllers: [MarketingController, SocialController]
})
export class MarketingModule {}
