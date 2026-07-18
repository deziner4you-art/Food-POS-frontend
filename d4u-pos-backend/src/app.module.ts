import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway';

// Core Modules (پہلے سے موجود)
import { AuthModule } from './modules/core/auth/auth.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { InventoryModule } from './modules/business/inventory/inventory.module';
import { DealModule } from './modules/business/deal/deal.module';
import { MarketingModule } from './modules/business/marketing/marketing.module';
import { CatalogModule } from './modules/business/catalog/catalog.module';

// نئے Modules (ابھی بنائے ہیں)
import { PosOrdersModule } from './modules/business/pos-orders/pos-orders.module';
import { KotsModule } from './modules/business/kots/kots.module';
import { BusinessDayModule } from './modules/business/business-day/business-day.module';
import { CashFlowModule } from './modules/business/cash-flow/cash-flow.module';
import { CustomersModule } from './modules/business/customers/customers.module';
import { ReportsModule } from './modules/business/reports/reports.module';
import { OnlineOrdersModule } from './modules/business/online-orders/online-orders.module';
import { RiderModule } from './modules/business/rider/rider.module';
import { VendorModule } from './modules/business/vendor/vendor.module';
import { CmsModule } from './modules/business/cms/cms.module';
import { StoresModule } from './modules/core/stores/stores.module';
import { RecipesModule } from './modules/business/recipes/recipes.module';
import { SubscriptionModule } from './modules/core/subscription/subscription.module';
import { UsersModule } from './modules/core/users/users.module';
import { SaasPackageModule } from './modules/core/saas-package/saas-package.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminalModule } from './modules/core/terminal/terminal.module';

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

    UsersModule,
    SaasPackageModule,
    TerminalModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule {}
