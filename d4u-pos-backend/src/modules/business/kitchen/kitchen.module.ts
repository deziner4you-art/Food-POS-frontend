import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { AppGateway } from '../../../app.gateway';

import { ChefSessionService } from './chef-session.service';
import { ChefAuthController } from './chef-auth.controller';

import { KitchenStationService } from './kitchen-station.service';
import { KitchenStationController } from './kitchen-station.controller';

import { KitchenDashboardService } from './kitchen-dashboard.service';
import { KitchenDashboardController } from './kitchen-dashboard.controller';

import { InventoryLockService } from './inventory-lock.service';
import { InventoryLockController } from './inventory-lock.controller';

import { StockRequestService } from './stock-request.service';
import { StockRequestController } from './stock-request.controller';

import { RecipeAvailabilityService } from './recipe-availability.service';
import { RecipeAvailabilityController } from './recipe-availability.controller';

// AppGateway is provided directly here — TerminalModule is @Global() but
// only exports TerminalService, not AppGateway itself, so every module that
// needs AppGateway (KotsModule, InventoryModule, MarketingModule,
// OnlineOrdersModule, PosOrdersModule, RiderModule, TerminalModule, ...)
// already follows this same pattern: its own local AppGateway instance,
// which still resolves fine since AppGateway's own dependency
// (TerminalService) IS globally available. Not refactoring that pre-existing
// pattern here — matching it exactly.
// JwtService (used by ChefSessionService.mintChefToken) is resolved via
// AuthModule's JwtModule.register({ global: true }).
@Module({
  imports: [PrismaModule],
  controllers: [
    ChefAuthController,
    KitchenStationController,
    KitchenDashboardController,
    InventoryLockController,
    StockRequestController,
    RecipeAvailabilityController,
  ],
  providers: [
    AppGateway,
    ChefSessionService,
    KitchenStationService,
    KitchenDashboardService,
    InventoryLockService,
    StockRequestService,
    RecipeAvailabilityService,
  ],
  exports: [
    ChefSessionService,
    KitchenStationService,
    KitchenDashboardService,
    InventoryLockService,
    StockRequestService,
    RecipeAvailabilityService,
  ],
})
export class KitchenModule {}
