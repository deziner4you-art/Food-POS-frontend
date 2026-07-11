import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway';

// Core Modules (پہلے سے موجود)
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { InventoryModule } from './inventory/inventory.module';
import { DealModule } from './deal/deal.module';
import { MarketingModule } from './marketing/marketing.module';
import { CatalogModule } from './catalog/catalog.module';

// نئے Modules (ابھی بنائے ہیں)
import { PosOrdersModule } from './pos-orders/pos-orders.module';
import { KotsModule } from './kots/kots.module';
import { BusinessDayModule } from './business-day/business-day.module';
import { CashFlowModule } from './cash-flow/cash-flow.module';
import { CustomersModule } from './customers/customers.module';
import { ReportsModule } from './reports/reports.module';
import { OnlineOrdersModule } from './online-orders/online-orders.module';
import { RiderModule } from './rider/rider.module';
import { VendorModule } from './vendor/vendor.module';
import { CmsModule } from './cms/cms.module';
import { StoresModule } from './stores/stores.module';
import { RecipesModule } from './recipes/recipes.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // Core
    PrismaModule,
    AuthModule,

    // Product Catalog
    CatalogModule,

    // Order Management
    PosOrdersModule,
    KotsModule,

    // Business Day & Cash
    BusinessDayModule,
    CashFlowModule,

    // CRM
    CustomersModule,

    // Inventory & Deals
    InventoryModule,
    DealModule,
    MarketingModule,

    // Reports
    ReportsModule,

    OnlineOrdersModule,

    RiderModule,

    VendorModule,

    CmsModule,

    StoresModule,

    RecipesModule,

    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule {}
