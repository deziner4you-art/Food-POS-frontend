import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { AppGateway } from '../../../app.gateway';

@Module({
  imports: [PrismaModule],
  providers: [MarketingService, SocialService, AppGateway],
  controllers: [MarketingController, SocialController],
})
export class MarketingModule {}
