import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: any;
  let prisma: any;

  beforeEach(async () => {
    service = {
      syncOfflineTransactions: jest.fn(),
      getNegativeInventory: jest.fn(),
      getLowStockItems: jest.fn(),
      getInventoryItems: jest.fn(),
      getInventoryItem: jest.fn(),
      createInventoryItem: jest.fn(),
      updateInventoryItem: jest.fn(),
      deleteInventoryItem: jest.fn(),
      recordPurchase: jest.fn(),
    };
    prisma = {
      store: { findUnique: jest.fn().mockResolvedValue({ id: 67, brand_id: 10 }) },
      user: { findUnique: jest.fn().mockResolvedValue({ role: { name: 'Cashier' } }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: InventoryService, useValue: service },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-B1: migrated off the legacy 2-segment 'inventory.*' strings onto
  // the real 'inventory.products.*' catalog permissions (#2R-A confirmed these
  // already exist and are already granted to Inventory Manager/Branch
  // Manager). Straight swap, not additive -- 'inventory.*' was never in the
  // posPermissions compatibility bridge, so nobody had access via any path
  // except Super Admin before this change; it is a pure widening.
  describe('@RequirePermissions metadata (Task #2R-B1)', () => {
    it('GET /inventory/items/:store_id requires inventory.products.read', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getInventoryItems);
      expect(metadata).toEqual(['inventory.products.read']);
    });

    it('GET /inventory/item/:id requires inventory.products.read', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getInventoryItem);
      expect(metadata).toEqual(['inventory.products.read']);
    });

    it('POST /inventory/items requires inventory.products.create', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.createInventoryItem);
      expect(metadata).toEqual(['inventory.products.create']);
    });

    it('PATCH /inventory/items/:id requires inventory.products.update', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.updateInventoryItem);
      expect(metadata).toEqual(['inventory.products.update']);
    });

    it('DELETE /inventory/items/:id requires inventory.products.delete', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.deleteInventoryItem);
      expect(metadata).toEqual(['inventory.products.delete']);
    });
  });

  // Unrelated routes retain their current (still-legacy, out of #2R-B1 scope)
  // authorization decorators, confirming this was isolated to exactly the 5
  // item-CRUD routes above.
  describe('unrelated routes are unaffected (Task #2R-B1)', () => {
    it('POST /inventory/sync-offline still requires inventory.create', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.syncOffline);
      expect(metadata).toEqual(['inventory.create']);
    });

    it('GET /inventory/red-alerts/:store_id still requires inventory.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getNegativeInventory);
      expect(metadata).toEqual(['inventory.view']);
    });

    it('GET /inventory/low-stock/:store_id still requires inventory.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getLowStockItems);
      expect(metadata).toEqual(['inventory.view']);
    });

    it('POST /inventory/purchase still requires inventory.create', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.recordPurchase);
      expect(metadata).toEqual(['inventory.create']);
    });

    it('POST /inventory/import-excel still requires inventory.create', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.importExcel);
      expect(metadata).toEqual(['inventory.create']);
    });

    it('POST /inventory/adjust still requires inventory.update', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.adjustStock);
      expect(metadata).toEqual(['inventory.update']);
    });

    it('GET /inventory/items/:id/history still requires inventory.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getItemHistory);
      expect(metadata).toEqual(['inventory.view']);
    });
  });

  // Task #2R-G1b1: #2R-G1b1 confirmed these 4 routes have zero frontend
  // caller in either app, so migrating them to assertOwnStore carries no
  // dual-use risk. syncOffline's own IDOR fix is covered separately in
  // inventory.service.spec.ts.
  describe('active-store authorization -- migrated routes (Task #2R-G1b1)', () => {
    const OWN = { sub: 88, active_store_id: 67 };

    it('syncOffline: same-store -> allowed', async () => {
      await controller.syncOffline(OWN, { store_id: 67, transactions: [] } as any);
      expect(service.syncOfflineTransactions).toHaveBeenCalledWith(67, []);
    });

    it('syncOffline: cross-store -> rejected, service never called', async () => {
      await expect(
        controller.syncOffline(OWN, { store_id: 999, transactions: [] } as any),
      ).rejects.toThrow(ForbiddenException);
      expect(service.syncOfflineTransactions).not.toHaveBeenCalled();
    });

    it('getNegativeInventory: same-store -> allowed', async () => {
      await controller.getNegativeInventory(OWN, 67);
      expect(service.getNegativeInventory).toHaveBeenCalledWith(67);
    });

    it('getNegativeInventory: cross-store -> rejected, service never called', async () => {
      await expect(controller.getNegativeInventory(OWN, 999)).rejects.toThrow(ForbiddenException);
      expect(service.getNegativeInventory).not.toHaveBeenCalled();
    });

    it('getLowStockItems: same-store -> allowed', async () => {
      await controller.getLowStockItems(OWN, 67);
      expect(service.getLowStockItems).toHaveBeenCalledWith(67);
    });

    it('getLowStockItems: cross-store -> rejected, service never called', async () => {
      await expect(controller.getLowStockItems(OWN, 999)).rejects.toThrow(ForbiddenException);
      expect(service.getLowStockItems).not.toHaveBeenCalled();
    });

    it('getInventoryItem: own-store item (server-loaded) -> allowed', async () => {
      service.getInventoryItem.mockResolvedValue({ id: 5, store_id: 67 });
      const result = await controller.getInventoryItem(OWN, 5);
      expect(result).toEqual({ id: 5, store_id: 67 });
    });

    it('getInventoryItem: foreign-store item (server-loaded) -> rejected using the loaded item.store_id, not any client-supplied value', async () => {
      service.getInventoryItem.mockResolvedValue({ id: 5, store_id: 999 });
      await expect(controller.getInventoryItem(OWN, 5)).rejects.toThrow(ForbiddenException);
    });

    it('getInventoryItem: no item found -> no tenant check attempted, returns undefined', async () => {
      service.getInventoryItem.mockResolvedValue(undefined);
      const result = await controller.getInventoryItem(OWN, 999);
      expect(result).toBeUndefined();
    });
  });

  describe('tenant boundary protection (P0.4-C)', () => {
    const OWN_SESSION = { sub: 1, active_store_id: 67, active_brand_id: 10 };

    it('getInventoryItems: same-brand Head Office may access another branch', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: { name: 'HeadOffice' } });
      service.getInventoryItems.mockResolvedValue([]);
      await expect(controller.getInventoryItems(OWN_SESSION, 999)).resolves.toEqual([]);
    });

    it('getInventoryItems: normal user cannot access another store', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: 999, brand_id: 10 });
      await expect(controller.getInventoryItems(OWN_SESSION, 999)).rejects.toThrow(ForbiddenException);
      expect(service.getInventoryItems).not.toHaveBeenCalled();
    });

    it('createInventoryItem: cross-brand request is rejected', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: 999, brand_id: 99 });
      service.createInventoryItem.mockResolvedValue({ id: 1 });
      await expect(controller.createInventoryItem(OWN_SESSION, { store_id: 999 } as any)).rejects.toThrow(ForbiddenException);
      expect(service.createInventoryItem).not.toHaveBeenCalled();
    });

    it('updateInventoryItem: foreign-store server-loaded item is rejected', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: 999, brand_id: 10 });
      service.getInventoryItem.mockResolvedValue({ id: 5, store_id: 999 });
      service.updateInventoryItem.mockResolvedValue({ id: 5 });
      await expect(controller.updateInventoryItem(OWN_SESSION, 5, {} as any)).rejects.toThrow(ForbiddenException);
      expect(service.updateInventoryItem).not.toHaveBeenCalled();
    });

    it('deleteInventoryItem: foreign-store server-loaded item is rejected', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: 999, brand_id: 10 });
      service.getInventoryItem.mockResolvedValue({ id: 5, store_id: 999 });
      service.deleteInventoryItem.mockResolvedValue({ id: 5 });
      await expect(controller.deleteInventoryItem(OWN_SESSION, 5)).rejects.toThrow(ForbiddenException);
      expect(service.deleteInventoryItem).not.toHaveBeenCalled();
    });

    it('recordPurchase: cross-store request is rejected before mutation', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: 999, brand_id: 10 });
      service.recordPurchase.mockResolvedValue({ success: true });
      await expect(controller.recordPurchase(OWN_SESSION, { store_id: 999, inventory_id: 1, quantity: 1, total_cost: 1 } as any)).rejects.toThrow(ForbiddenException);
      expect(service.recordPurchase).not.toHaveBeenCalled();
    });
  });
});
