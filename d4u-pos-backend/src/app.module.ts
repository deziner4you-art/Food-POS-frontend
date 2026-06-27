import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { InventoryModule } from './inventory/inventory.module';
import { DealModule } from './deal/deal.module';
import { MarketingModule } from './marketing/marketing.module';
import { CatalogModule } from './catalog/catalog.module';
import { AppGateway } from './app.gateway';

@Module({
  imports: [AuthModule, PrismaModule, InventoryModule, DealModule, MarketingModule, CatalogModule],
  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule {}
