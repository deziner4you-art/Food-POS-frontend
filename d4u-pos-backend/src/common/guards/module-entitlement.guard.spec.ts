import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleEntitlementGuard } from './module-entitlement.guard';
import { REQUIRED_MODULE_KEY } from '../decorators/require-module.decorator';
import { ChefAuthController } from '../../modules/business/kitchen/chef-auth.controller';
import { InventoryLockController } from '../../modules/business/kitchen/inventory-lock.controller';
import { KitchenDashboardController } from '../../modules/business/kitchen/kitchen-dashboard.controller';
import { KitchenStationController } from '../../modules/business/kitchen/kitchen-station.controller';
import { RecipeAvailabilityController } from '../../modules/business/kitchen/recipe-availability.controller';
import { StockRequestController } from '../../modules/business/kitchen/stock-request.controller';
import { KotsController } from '../../modules/business/kots/kots.controller';
import { MarketingController } from '../../modules/business/marketing/marketing.controller';
import { SocialController } from '../../modules/business/marketing/social.controller';
import { CmsController } from '../../modules/business/cms/cms.controller';

describe('ModuleEntitlementGuard', () => {
  const snapshot = (overrides: Partial<any> = {}) => ({
    tenant: { brandId: 1, storeId: 7, brandName: 'Brand', storeName: 'Store' },
    subscription: { status: 'ACTIVE', packageId: 3, packageCode: 'POS', expiresAt: null },
    modules: ['BASE_POS', 'KDS'],
    capabilities: {
      pos: true,
      kotPrint: true,
      businessDay: true,
      dailyReports: true,
      accounting: true,
      kds: true,
      marketing: false,
      website: false,
      cms: false,
      crm: false,
      loyalty: false,
      rider: false,
      tvBoard: false,
      inventory: false,
      recipes: false,
      vendors: false,
      analytics: false,
      hrPayroll: false,
    },
    entitlement: { enabled: true, reason: null, missingDependencies: {} },
    ...overrides,
  });

  const context = (request: any): ExecutionContext => ({
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext);

  function makeGuard(requiredModule: string | null, resolved = snapshot(), isPublic = false) {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === 'required_module') return requiredModule;
        if (key === 'isPublic') return isPublic;
        return false;
      }),
    } as unknown as Reflector;
    const entitlements = {
      resolveForAuthenticatedUser: jest.fn().mockResolvedValue(resolved),
      resolveForStore: jest.fn().mockResolvedValue(resolved),
      isCapabilityEnabled: jest.fn((value: any, moduleKey: string) => {
        if (moduleKey === 'KDS') return value.capabilities.kds;
        if (moduleKey === 'BASE_POS') return value.capabilities.pos;
        if (moduleKey === 'KOT_PRINT') return value.capabilities.kotPrint;
        if (moduleKey === 'ONLINE_WEBSITE') return value.capabilities.website;
        if (moduleKey === 'CMS') return value.capabilities.cms;
        return false;
      }),
    } as any;
    return { guard: new ModuleEntitlementGuard(reflector, entitlements), entitlements };
  }

  it('allows routes without module metadata', async () => {
    const { guard, entitlements } = makeGuard(null);
    await expect(guard.canActivate(context({ user: { sub: 10 } }))).resolves.toBe(true);
    expect(entitlements.resolveForAuthenticatedUser).not.toHaveBeenCalled();
  });

  it('preserves public routes that have no module metadata', async () => {
    const { guard, entitlements } = makeGuard(null, snapshot(), true);
    await expect(guard.canActivate(context({ user: undefined, query: { store_id: '7' }, params: {}, body: {} }))).resolves.toBe(true);
    expect(entitlements.resolveForStore).not.toHaveBeenCalled();
  });

  it('requires a valid public store and checks the store entitlement', async () => {
    const { guard, entitlements } = makeGuard('ONLINE_WEBSITE', snapshot({
      capabilities: { ...snapshot().capabilities, website: true },
    }), true);

    await expect(guard.canActivate(context({
      user: undefined,
      query: { store_id: '7' },
      params: {},
      body: {},
    }))).resolves.toBe(true);
    expect(entitlements.resolveForStore).toHaveBeenCalledWith(7);
  });

  it('rejects a public module route when store identity is missing', async () => {
    const { guard, entitlements } = makeGuard('ONLINE_WEBSITE', snapshot(), true);

    await expect(guard.canActivate(context({ user: undefined, query: {}, params: {}, body: {} })))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(entitlements.resolveForStore).not.toHaveBeenCalled();
  });

  it('rejects a public website route when the store lacks the website module', async () => {
    const { guard } = makeGuard('ONLINE_WEBSITE', snapshot(), true);

    await expect(guard.canActivate(context({
      user: undefined,
      query: { store_id: '7' },
      params: {},
      body: {},
    }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows KDS when the authenticated store has the KDS capability', async () => {
    const { guard, entitlements } = makeGuard('KDS');
    await expect(guard.canActivate(context({
      user: { sub: 10, active_store_id: 7 },
      query: { store_id: '7' },
      params: {},
      body: {},
    }))).resolves.toBe(true);
    expect(entitlements.resolveForAuthenticatedUser).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 10 }),
      7,
    );
  });

  it('rejects a POS-only package at a KDS route', async () => {
    const { guard } = makeGuard('KDS', snapshot({
      modules: ['BASE_POS'],
      capabilities: { ...snapshot().capabilities, kds: false },
    }));
    await expect(guard.canActivate(context({
      user: { sub: 10, active_store_id: 7 },
      query: { store_id: '7' },
      params: {},
      body: {},
    }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows the actionable KOT workflow for POS-only when KOT printing is included', async () => {
    const { guard } = makeGuard('KOT_PRINT', snapshot({
      modules: ['BASE_POS'],
      capabilities: { ...snapshot().capabilities, kds: false, kotPrint: true },
    }));
    await expect(guard.canActivate(context({
      user: { sub: 10, active_store_id: 7 },
      query: { store_id: '7' },
      params: {},
      body: {},
    }))).resolves.toBe(true);
  });

  it('uses the authenticated active store for action routes without a store query', async () => {
    const { guard, entitlements } = makeGuard('KDS');
    await expect(guard.canActivate(context({
      user: { sub: 10, active_store_id: 7 },
      query: {},
      params: { id: '42' },
      body: {},
    }))).resolves.toBe(true);
    expect(entitlements.resolveForAuthenticatedUser).toHaveBeenCalledWith(
      expect.anything(),
      7,
    );
  });

  it('rejects a request with no resolvable active store', async () => {
    const { guard } = makeGuard('KDS');
    await expect(guard.canActivate(context({
      user: { sub: 10 },
      query: {},
      params: {},
      body: {},
    }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not let a client choose a different store for a non-super-admin workspace', async () => {
    const { guard, entitlements } = makeGuard('KDS');
    entitlements.resolveForAuthenticatedUser.mockRejectedValueOnce(
      new ForbiddenException('The requested store is outside the active workspace.'),
    );
    await expect(guard.canActivate(context({
      user: { sub: 10, active_store_id: 7 },
      query: { store_id: '8' },
      params: {},
      body: {},
    }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('marks every dedicated kitchen route group as KDS-entitled', () => {
    for (const controller of [
      ChefAuthController,
      InventoryLockController,
      KitchenDashboardController,
      KitchenStationController,
      RecipeAvailabilityController,
      StockRequestController,
    ]) {
      expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, controller)).toBe('KDS');
    }
    expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, KotsController)).toBe('KOT_PRINT');
    expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, MarketingController)).toBe('MARKETING');
    expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, SocialController)).toBe('MARKETING');
    expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, CmsController)).toBe('CMS');
    expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, CmsController.prototype.getBanners)).toBe('ONLINE_WEBSITE');
    expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, CmsController.prototype.getSettings)).toBe('ONLINE_WEBSITE');
    expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, CmsController.prototype.subscribe)).toBe('ONLINE_WEBSITE');
    expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, CmsController.prototype.verifyInventoryPin)).toBe('KDS');
  });
});
