import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PosOrdersController } from './pos-orders.controller';
import { PosOrdersService } from './pos-orders.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';

// Task #2Q-B2: delivery.dispatch.update_status added to PATCH /:id/status as
// an additional accepted permission (OR semantics) so a Rider progressing
// their own POS-native delivery (RIDER_ARRIVED/OUT_FOR_DELIVERY/DELIVERED/
// etc., see d4u-rider's updateBridgeStatus) can reach this route without
// touching staff's existing pos.orders.update-based access at all. Sibling
// fix to online-orders.controller.ts's PATCH /:id. Rider-ownership
// enforcement (Order.rider_id match) is #2Q-B3, not yet implemented.
describe('PosOrdersController', () => {
  let controller: PosOrdersController;
  let service: any;

  // Task #2R-G1a: fixtures named after the three real roles #2R-G1-D
  // confirmed hold pos.orders.* today (Cashier/Manager/Branch Manager), each
  // scoped to store 67 -- but the `role` field is purely documentary here.
  // assertOwnStore never reads it; these tests exist to prove that.
  const CASHIER = { sub: 88, role: 'Cashier', active_store_id: 67 };
  const MANAGER = { sub: 89, role: 'Manager', active_store_id: 67 };
  const BRANCH_MANAGER = { sub: 90, role: 'Branch Manager', active_store_id: 67 };

  const ORDER_OWN = { id: 500, store_id: 67 };
  const ORDER_OTHER = { id: 501, store_id: 999 };

  beforeEach(async () => {
    service = {
      getOrders: jest.fn(),
      getSalesSummary: jest.fn(),
      getOrder: jest.fn(),
      createOrder: jest.fn(),
      voidOrder: jest.fn(),
      settleOrder: jest.fn(),
      updateDeliveryStatus: jest.fn(),
      syncOfflineOrders: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosOrdersController],
      providers: [{ provide: PosOrdersService, useValue: service }],
    }).compile();

    controller = module.get<PosOrdersController>(PosOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('@RequirePermissions metadata (Task #2Q-B2)', () => {
    it('PATCH /pos-orders/:id/status accepts both pos.orders.update (existing staff access) and delivery.dispatch.update_status (new Rider access)', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.updateDeliveryStatus);
      expect(metadata).toEqual(['pos.orders.update', 'delivery.dispatch.update_status']);
    });

    it('PATCH /pos-orders/:id/void is untouched -- still requires only pos.orders.update', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.voidOrder);
      expect(metadata).toEqual(['pos.orders.update']);
    });

    it('PATCH /pos-orders/:id/settle is untouched -- still requires only pos.orders.update', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.settleOrder);
      expect(metadata).toEqual(['pos.orders.update']);
    });

    it('GET /pos-orders is untouched -- still requires only pos.orders.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getOrders)).toEqual(['pos.orders.read']);
    });

    it('POST /pos-orders is untouched -- still requires only pos.orders.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createOrder)).toEqual(['pos.orders.create']);
    });

    it('POST /pos-orders/sync-offline is untouched -- still requires only pos.orders.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.syncOffline)).toEqual(['pos.orders.create']);
    });
  });

  // Task #2R-G1a: previously validateTenantAccess (a no-op for real staff
  // sessions -- see tenant.util.spec.ts) was the only tenant boundary on
  // every one of these 8 routes. Migrated onto assertOwnStore; this suite
  // verifies both the allowed and rejected shape for each.
  describe('active-store authorization (Task #2R-G1a)', () => {
    it('1. same-store list -> allowed, delegates with the requested store_id', () => {
      service.getOrders.mockResolvedValue([]);
      controller.getOrders(CASHIER, '67');
      expect(service.getOrders).toHaveBeenCalledWith(67, undefined, undefined);
    });

    it('2. cross-store list -> rejected, service never called', () => {
      expect(() => controller.getOrders(MANAGER, '999')).toThrow(ForbiddenException);
      expect(service.getOrders).not.toHaveBeenCalled();
    });

    it('3. same-store summary -> allowed', () => {
      controller.getSummary(CASHIER, '67');
      expect(service.getSalesSummary).toHaveBeenCalledWith(67, undefined);
    });

    it('4. cross-store summary -> rejected, service never called', () => {
      expect(() => controller.getSummary(BRANCH_MANAGER, '999')).toThrow(ForbiddenException);
      expect(service.getSalesSummary).not.toHaveBeenCalled();
    });

    it('5. own-store order by ID -> allowed', async () => {
      service.getOrder.mockResolvedValue(ORDER_OWN);
      const result = await controller.getOrder(CASHIER, '500');
      expect(result).toBe(ORDER_OWN);
    });

    it('6. cross-store order ID -> rejected using the server-loaded order.store_id (not any client-supplied value)', async () => {
      service.getOrder.mockResolvedValue(ORDER_OTHER);
      await expect(controller.getOrder(CASHIER, '501')).rejects.toThrow(ForbiddenException);
    });

    it('7. create own-store -> allowed', () => {
      controller.createOrder(MANAGER, { store_id: 67, items: [] } as any);
      expect(service.createOrder).toHaveBeenCalledWith({ store_id: 67, items: [] });
    });

    it('8. create cross-store -> rejected, service never called', () => {
      expect(() => controller.createOrder(CASHIER, { store_id: 999, items: [] } as any)).toThrow(
        ForbiddenException,
      );
      expect(service.createOrder).not.toHaveBeenCalled();
    });

    it('void: own-store order -> allowed', async () => {
      service.getOrder.mockResolvedValue(ORDER_OWN);
      await controller.voidOrder(MANAGER, '500', { void_reason: 'test' } as any);
      expect(service.voidOrder).toHaveBeenCalledWith(500, { void_reason: 'test' });
    });

    it('9. void cross-store order -> rejected, voidOrder never called', async () => {
      service.getOrder.mockResolvedValue(ORDER_OTHER);
      await expect(controller.voidOrder(MANAGER, '501', { void_reason: 'test' } as any)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.voidOrder).not.toHaveBeenCalled();
    });

    it('settle: own-store order -> allowed', async () => {
      service.getOrder.mockResolvedValue(ORDER_OWN);
      await controller.settleOrder(CASHIER, '500', { payment_method: 'CASH' } as any);
      expect(service.settleOrder).toHaveBeenCalledWith(500, { payment_method: 'CASH' });
    });

    it('10. settle cross-store order -> rejected, settleOrder never called', async () => {
      service.getOrder.mockResolvedValue(ORDER_OTHER);
      await expect(controller.settleOrder(CASHIER, '501', { payment_method: 'CASH' } as any)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.settleOrder).not.toHaveBeenCalled();
    });

    it('delivery-status: own-store order -> allowed', async () => {
      service.getOrder.mockResolvedValue(ORDER_OWN);
      await controller.updateDeliveryStatus(BRANCH_MANAGER, '500', { status: 'DISPATCHED' });
      expect(service.updateDeliveryStatus).toHaveBeenCalledWith(500, 'DISPATCHED', BRANCH_MANAGER);
    });

    it('11. delivery-status cross-store order -> rejected, updateDeliveryStatus never called', async () => {
      service.getOrder.mockResolvedValue(ORDER_OTHER);
      await expect(
        controller.updateDeliveryStatus(BRANCH_MANAGER, '501', { status: 'DISPATCHED' }),
      ).rejects.toThrow(ForbiddenException);
      expect(service.updateDeliveryStatus).not.toHaveBeenCalled();
    });
  });

  // Task #2R-G1a: syncOffline previously validated only body.orders[0].store_id.
  // A batch [own-store, other-store] would sync BOTH orders in full. Every
  // order is now checked before the service is ever invoked.
  describe('syncOffline — full-batch active-store authorization (Task #2R-G1a)', () => {
    it('12. same-store batch -> allowed, all orders passed through to the service', () => {
      const orders = [{ store_id: 67, x: 1 }, { store_id: 67, x: 2 }];
      controller.syncOffline(CASHIER, { orders } as any);
      expect(service.syncOfflineOrders).toHaveBeenCalledWith(orders);
    });

    it('13. mixed-store batch (own store first, foreign store second) -> rejected, service never called', () => {
      const orders = [{ store_id: 67 }, { store_id: 999 }];
      expect(() => controller.syncOffline(CASHIER, { orders } as any)).toThrow(ForbiddenException);
      expect(service.syncOfflineOrders).not.toHaveBeenCalled();
    });

    it('14. mixed-store batch (foreign store first, own store second) -> rejected, service never called -- proves the old "only check index 0" gap is closed', () => {
      const orders = [{ store_id: 999 }, { store_id: 67 }];
      expect(() => controller.syncOffline(MANAGER, { orders } as any)).toThrow(ForbiddenException);
      expect(service.syncOfflineOrders).not.toHaveBeenCalled();
    });

    it('15. proves the batch is fully validated before any service call -- rejection happens synchronously pre-call, zero partial processing', () => {
      const orders = [{ store_id: 67 }, { store_id: 67 }, { store_id: 999 }];
      let threw = false;
      try {
        controller.syncOffline(BRANCH_MANAGER, { orders } as any);
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(true);
      expect(service.syncOfflineOrders).not.toHaveBeenCalled();
    });

    it('empty/omitted batch -> no validation error, delegates an empty array (unchanged prior behavior)', () => {
      controller.syncOffline(CASHIER, {} as any);
      expect(service.syncOfflineOrders).toHaveBeenCalledWith([]);
    });
  });
});
