import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';

describe('InventoryController', () => {
  let controller: InventoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [{ provide: InventoryService, useValue: {} }],
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
});
