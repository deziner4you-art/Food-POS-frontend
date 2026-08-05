import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway';
import { ThrottlerModule } from '@nestjs/throttler';

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
import { CustomerAddressesModule } from './modules/business/customer-addresses/customer-addresses.module';
import { ReportsModule } from './modules/business/reports/reports.module';
import { OnlineOrdersModule } from './modules/business/online-orders/online-orders.module';
import { RiderModule } from './modules/business/rider/rider.module';
import { VendorModule } from './modules/business/vendor/vendor.module';
import { CmsModule } from './modules/business/cms/cms.module';
import { StoresModule } from './modules/core/stores/stores.module';
import { RecipesModule } from './modules/business/recipes/recipes.module';
import { UsersModule } from './modules/core/users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminalModule } from './modules/core/terminal/terminal.module';
import { AccountingModule } from './modules/business/accounting/accounting.module';
import { SubscriptionModule } from './modules/core/subscription/subscription.module';
import { TablesModule } from './modules/business/tables/tables.module';
import { ProductRequestsModule } from './modules/business/product-requests/product-requests.module';
import { CampaignResolverModule } from './modules/business/pos-orders/campaign-resolver.module';
import { KitchenModule } from './modules/business/kitchen/kitchen.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CatalogModule,
    PosOrdersModule,
    KotsModule,
    BusinessDayModule,
    CashFlowModule,
    CustomersModule,
    CustomerAddressesModule,
    InventoryModule,
    DealModule,
    MarketingModule,
    ReportsModule,
    OnlineOrdersModule,
    RiderModule,
    VendorModule,
    CmsModule,
    StoresModule,
    RecipesModule,
    UsersModule,
    TerminalModule,
    AccountingModule,
    SubscriptionModule,
    TablesModule,
    ProductRequestsModule,
    CampaignResolverModule,
    KitchenModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    AppGateway,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
})
export class AppModule {}
