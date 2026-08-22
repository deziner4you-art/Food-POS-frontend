import { Test, TestingModule } from '@nestjs/testing';
import { OnlineOrdersController } from './online-orders.controller';
import { OnlineOrdersService } from './online-orders.service';
import { CustomerAddressesService } from '../customer-addresses/customer-addresses.service';
import { CustomerFavoritesService } from '../customer-favorites/customer-favorites.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

describe('OnlineOrdersController', () => {
  let controller: OnlineOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnlineOrdersController],
      providers: [
        { provide: OnlineOrdersService, useValue: {} },
        { provide: CustomerAddressesService, useValue: {} },
        { provide: CustomerFavoritesService, useValue: {} },
      ],
    }).compile();

    controller = module.get<OnlineOrdersController>(OnlineOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2Q-B2: delivery.dispatch.update_status added as an additional
  // accepted permission (OR semantics -- PermissionsGuard passes if the
  // caller holds ANY listed permission) so a Rider progressing their own
  // claimed delivery can reach this route without touching staff's existing
  // sales.update-based access at all. Rider-ownership enforcement (#2Q-B3)
  // lives in OnlineOrdersService.updateOrderStatus, untouched here.
  //
  // Task #2R-B2: pos.orders.update added alongside sales.update (still
  // additive, now a 3-way OR). #2R-A found sales.update is only reachable
  // via the posPermissions bridge; pos.orders.update is a real grant already
  // held by Cashier/Manager/Branch Manager. sales.update stays because
  // Business Admin/Business Owner/Branch Owner reach this route via the
  // bridge today and hold no real pos.orders.update grant.
  describe('@RequirePermissions metadata (Tasks #2Q-B2 / #2R-B2)', () => {
    it('PATCH /online-orders/:id accepts sales.update, pos.orders.update, and delivery.dispatch.update_status', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.updateOrderStatus);
      expect(metadata).toEqual(['sales.update', 'pos.orders.update', 'delivery.dispatch.update_status']);
    });
  });

  // Task #2Q-E1: migrated off staff-only sales.create onto @Public(), matching
  // its 11 sibling customer-self-service routes in this same controller --
  // see #2Q-E's audit for the evidence (no auth token ever sent by the only
  // real caller, and the project's own migration handover doc describing
  // this as a customer-facing feature).
  describe('@Public() metadata (Task #2Q-E1)', () => {
    it('POST /online-orders/:id/feedback is public -- IS_PUBLIC_KEY is set to true', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.postFeedback);
      expect(isPublic).toBe(true);
    });

    it('POST /online-orders/:id/feedback no longer carries any @RequirePermissions metadata', () => {
      const permissions = Reflect.getMetadata(PERMISSIONS_KEY, controller.postFeedback);
      expect(permissions).toBeUndefined();
    });

    it('handler delegation to the service is unchanged', () => {
      const service = { postFeedback: jest.fn() };
      (controller as any).service = service;

      controller.postFeedback('42', { rating: 5, comment: 'Great!' } as any);

      expect(service.postFeedback).toHaveBeenCalledWith(42, 5, 'Great!');
    });
  });

  // Task #2R-B1: pos.orders.read added alongside the legacy sales.view (OR
  // semantics, same additive pattern as #2Q-B2). #2R-A found sales.view is
  // only reachable via the posPermissions compatibility bridge; pos.orders.read
  // is a real catalog permission already granted to Cashier/Manager/Branch
  // Manager/Waiter. sales.view is kept, not removed, because Business
  // Admin/Business Owner/Branch Owner reach this route via the bridge today
  // and hold no real pos.orders.read grant -- a straight swap would have
  // silently dropped their access.
  describe('@RequirePermissions metadata (Task #2R-B1)', () => {
    it('GET /online-orders requires sales.view OR pos.orders.read', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getOrders);
      expect(metadata).toEqual(['sales.view', 'pos.orders.read']);
    });

    it('GET /online-orders/:id requires sales.view OR pos.orders.read', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getOrder);
      expect(metadata).toEqual(['sales.view', 'pos.orders.read']);
    });
  });

  // Unrelated routes retain their current authorization decorators,
  // confirming the #2R-B1/#2R-B2 changes were isolated to GET/PATCH above.
  describe('unrelated routes are unaffected (Tasks #2R-B1 / #2R-B2)', () => {
    it('trackOrder is still public (unrelated to this change, sanity check)', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.trackOrder);
      expect(isPublic).toBe(true);
    });
  });
});
