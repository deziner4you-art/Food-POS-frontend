import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PosOrdersController } from './pos-orders.controller';
import { KotsController } from '../kots/kots.controller';
import { ModuleEntitlementGuard } from '../../../common/guards/module-entitlement.guard';
import { EntitlementService } from '../../core/subscription/entitlement.service';
import { RiderService } from '../rider/rider.service';
import { REQUIRED_MODULE_KEY } from '../../../common/decorators/require-module.decorator';

describe('POS KOT Entitlement & Subscription Behavioral Suite', () => {
  const posOnlyPackage = {
    id: 10,
    code: 'PKG_POS_ONLY',
    status: 'ACTIVE',
    modules: [{ module_key: 'BASE_POS' }],
  };

  const posKdsPackage = {
    id: 20,
    code: 'PKG_POS_KDS',
    status: 'ACTIVE',
    modules: [{ module_key: 'BASE_POS' }, { module_key: 'KDS' }],
  };

  function createMockPrisma(opts: {
    storePackage?: any;
    subscription?: any;
  }) {
    const store = {
      id: 5,
      brand_id: 100,
      name: 'Test Branch',
      brand: { id: 100, name: 'Test Brand' },
      saas_package: opts.storePackage ?? null,
    };
    return {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          brand_id: 100,
          store_id: 5,
          role: { name: 'Cashier' },
        }),
      },
      store: {
        findUnique: jest.fn().mockResolvedValue(store),
      },
      subscription: {
        findUnique: jest.fn().mockResolvedValue(opts.subscription ?? null),
      },
    };
  }

  function createGuardContext(storeId: number, userOverrides: any = {}): ExecutionContext {
    return {
      getHandler: () => () => {},
      getClass: () => PosOrdersController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: 1, active_store_id: storeId, active_brand_id: 100, ...userOverrides },
          query: { store_id: String(storeId) },
          params: {},
          body: { store_id: storeId },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  describe('1. Active POS-only subscription', () => {
    it('provisions BASE_POS and KOT_PRINT without requiring KDS', async () => {
      const prisma = createMockPrisma({
        storePackage: posOnlyPackage,
        subscription: {
          brand_id: 100,
          package_id: posOnlyPackage.id,
          status: 'ACTIVE',
          expiry_date: new Date(Date.now() + 86400000),
          package: posOnlyPackage,
        },
      });
      const entitlementService = new EntitlementService(prisma as any);
      const snapshot = await entitlementService.resolveForStore(5);

      expect(snapshot.entitlement.enabled).toBe(true);
      expect(snapshot.entitlement.reason).toBeNull();
      expect(snapshot.capabilities.pos).toBe(true);
      expect(snapshot.capabilities.kotPrint).toBe(true);
      expect(snapshot.capabilities.kds).toBe(false);

      expect(entitlementService.isCapabilityEnabled(snapshot, 'BASE_POS')).toBe(true);
      expect(entitlementService.isCapabilityEnabled(snapshot, 'KOT_PRINT')).toBe(true);
      expect(entitlementService.isCapabilityEnabled(snapshot, 'KDS')).toBe(false);
    });

    it('allows both PosOrdersController and KotsController under POS-only subscription', async () => {
      const prisma = createMockPrisma({
        storePackage: posOnlyPackage,
        subscription: {
          brand_id: 100,
          package_id: posOnlyPackage.id,
          status: 'ACTIVE',
          expiry_date: new Date(Date.now() + 86400000),
          package: posOnlyPackage,
        },
      });
      const entitlementService = new EntitlementService(prisma as any);

      // Verify PosOrdersController requires BASE_POS
      expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, PosOrdersController)).toBe('BASE_POS');
      // Verify KotsController requires KOT_PRINT
      expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, KotsController)).toBe('KOT_PRINT');

      const reflector = {
        getAllAndOverride: jest.fn((key: string) => {
          if (key === 'required_module') return 'BASE_POS';
          if (key === 'isPublic') return false;
          return null;
        }),
      } as unknown as Reflector;

      const guard = new ModuleEntitlementGuard(reflector, entitlementService);
      const canActivatePos = await guard.canActivate(createGuardContext(5));
      expect(canActivatePos).toBe(true);

      // Switch to KOT_PRINT check
      (reflector.getAllAndOverride as jest.Mock).mockImplementation((key: string) => {
        if (key === 'required_module') return 'KOT_PRINT';
        if (key === 'isPublic') return false;
        return null;
      });
      const canActivateKot = await guard.canActivate(createGuardContext(5));
      expect(canActivateKot).toBe(true);
    });
  });

  describe('2. Active POS + KDS subscription', () => {
    it('enables both POS KOT and KDS modes', async () => {
      const prisma = createMockPrisma({
        storePackage: posKdsPackage,
        subscription: {
          brand_id: 100,
          package_id: posKdsPackage.id,
          status: 'ACTIVE',
          expiry_date: new Date(Date.now() + 86400000),
          package: posKdsPackage,
        },
      });
      const entitlementService = new EntitlementService(prisma as any);
      const snapshot = await entitlementService.resolveForStore(5);

      expect(snapshot.entitlement.enabled).toBe(true);
      expect(snapshot.capabilities.pos).toBe(true);
      expect(snapshot.capabilities.kotPrint).toBe(true);
      expect(snapshot.capabilities.kds).toBe(true);

      expect(entitlementService.isCapabilityEnabled(snapshot, 'BASE_POS')).toBe(true);
      expect(entitlementService.isCapabilityEnabled(snapshot, 'KOT_PRINT')).toBe(true);
      expect(entitlementService.isCapabilityEnabled(snapshot, 'KDS')).toBe(true);
    });
  });

  describe('3. Missing subscription', () => {
    it('fails closed for both POS order creation and KOT retrieval with clear message', async () => {
      const prisma = createMockPrisma({
        storePackage: posOnlyPackage,
        subscription: null,
      });
      const entitlementService = new EntitlementService(prisma as any);
      const snapshot = await entitlementService.resolveForStore(5);

      expect(snapshot.entitlement.enabled).toBe(false);
      expect(snapshot.entitlement.reason).toBe('SUBSCRIPTION_NOT_FOUND');
      expect(snapshot.capabilities.pos).toBe(false);
      expect(snapshot.capabilities.kotPrint).toBe(false);

      const reflector = {
        getAllAndOverride: jest.fn((key: string) => {
          if (key === 'required_module') return 'BASE_POS';
          if (key === 'isPublic') return false;
          return null;
        }),
      } as unknown as Reflector;

      const guard = new ModuleEntitlementGuard(reflector, entitlementService);

      await expect(guard.canActivate(createGuardContext(5))).rejects.toThrow(
        new ForbiddenException({
          message: 'MODULE_NOT_INCLUDED',
          module: 'BASE_POS',
          reason: 'SUBSCRIPTION_NOT_FOUND',
        }),
      );

      (reflector.getAllAndOverride as jest.Mock).mockImplementation((key: string) => {
        if (key === 'required_module') return 'KOT_PRINT';
        if (key === 'isPublic') return false;
        return null;
      });

      await expect(guard.canActivate(createGuardContext(5))).rejects.toThrow(
        new ForbiddenException({
          message: 'MODULE_NOT_INCLUDED',
          module: 'KOT_PRINT',
          reason: 'SUBSCRIPTION_NOT_FOUND',
        }),
      );
    });
  });

  describe('4. Package assigned but subscription missing / mismatched', () => {
    it('fails closed with PACKAGE_SUBSCRIPTION_MISMATCH when store package does not match brand subscription package', async () => {
      const mismatchedPackage = { id: 99, code: 'PKG_MISMATCH', status: 'ACTIVE', modules: [{ module_key: 'BASE_POS' }] };
      const prisma = createMockPrisma({
        storePackage: mismatchedPackage,
        subscription: {
          brand_id: 100,
          package_id: posOnlyPackage.id, // 10 !== 99
          status: 'ACTIVE',
          expiry_date: new Date(Date.now() + 86400000),
          package: posOnlyPackage,
        },
      });
      const entitlementService = new EntitlementService(prisma as any);
      const snapshot = await entitlementService.resolveForStore(5);

      expect(snapshot.entitlement.enabled).toBe(false);
      expect(snapshot.entitlement.reason).toBe('PACKAGE_SUBSCRIPTION_MISMATCH');
      expect(snapshot.capabilities.pos).toBe(false);
      expect(snapshot.capabilities.kotPrint).toBe(false);

      const reflector = {
        getAllAndOverride: jest.fn((key: string) => {
          if (key === 'required_module') return 'BASE_POS';
          if (key === 'isPublic') return false;
          return null;
        }),
      } as unknown as Reflector;

      const guard = new ModuleEntitlementGuard(reflector, entitlementService);
      await expect(guard.canActivate(createGuardContext(5))).rejects.toThrow(
        new ForbiddenException({
          message: 'MODULE_NOT_INCLUDED',
          module: 'BASE_POS',
          reason: 'PACKAGE_SUBSCRIPTION_MISMATCH',
        }),
      );
    });

    it('fails closed with PACKAGE_NOT_ASSIGNED when store has no saas_package_id assigned', async () => {
      const prisma = createMockPrisma({
        storePackage: null,
        subscription: {
          brand_id: 100,
          package_id: posOnlyPackage.id,
          status: 'ACTIVE',
          expiry_date: new Date(Date.now() + 86400000),
          package: posOnlyPackage,
        },
      });
      const entitlementService = new EntitlementService(prisma as any);
      const snapshot = await entitlementService.resolveForStore(5);

      expect(snapshot.entitlement.enabled).toBe(false);
      expect(snapshot.entitlement.reason).toBe('PACKAGE_NOT_ASSIGNED');
      expect(snapshot.capabilities.pos).toBe(false);
    });
  });

  describe('5. POS delivery flow reaches rider queue only after READY', () => {
    it('excludes PENDING and PREPARING delivery orders from rider active delivery queue', async () => {
      const mockPrisma = {
        onlineOrder: { findMany: jest.fn().mockResolvedValue([]) },
        order: {
          findMany: jest.fn().mockImplementation(({ where }) => {
            // where.status.in contains validStatuses
            const requestedStatuses = where.status.in;
            expect(requestedStatuses).not.toContain('PENDING');
            expect(requestedStatuses).not.toContain('PREPARING');
            expect(requestedStatuses).toContain('READY');
            return Promise.resolve([]);
          }),
        },
      };

      const riderService = new RiderService(mockPrisma as any, {} as any);
      const orders = await riderService.getRiderOrders('5');
      expect(orders).toEqual([]);
      expect(mockPrisma.order.findMany).toHaveBeenCalledTimes(1);
    });

    it('includes POS delivery order in rider queue once its status is READY', async () => {
      const readyPosOrder = {
        id: 701,
        store_id: 5,
        status: 'READY',
        order_source: 'Delivery',
        total_amount: 1500,
        createdAt: new Date(),
        customer: { name: 'Ali Khan', phone: '03001234567' },
        items: [{ product: { name: 'Zinger Burger' }, quantity: 2, price: 750 }],
        rider: null,
      };

      const mockPrisma = {
        onlineOrder: { findMany: jest.fn().mockResolvedValue([]) },
        order: { findMany: jest.fn().mockResolvedValue([readyPosOrder]) },
      };

      const riderService = new RiderService(mockPrisma as any, {} as any);
      const orders = await riderService.getRiderOrders('5');

      expect(orders.length).toBe(1);
      expect(orders[0].id).toBe(701);
      expect(orders[0].status).toBe('READY');
      expect(orders[0].isPos).toBe(true);
      expect(orders[0].customer).toBe('Ali Khan');
    });
  });
});
