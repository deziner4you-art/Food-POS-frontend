import { Test, TestingModule } from '@nestjs/testing';
import { RiderController, RiderOrdersController } from './rider.controller';
import { RiderService } from './rider.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';

describe('RiderController', () => {
  let controller: RiderController;
  let service: { updateRiderGps: jest.Mock; getRiderGps: jest.Mock };

  const RIDER_A_TOKEN = { sub: 90, store_id: 67 }; // shape of a real, verified JWT payload

  beforeEach(async () => {
    service = { updateRiderGps: jest.fn().mockResolvedValue({ success: true }), getRiderGps: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiderController],
      providers: [{ provide: RiderService, useValue: service }],
    }).compile();

    controller = module.get<RiderController>(RiderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2Q-B2: system.create never matched any seeded permission or the
  // sales.* compatibility bridge -- confirmed in #2Q-A/#2Q-B this route was
  // reachable by nobody except Super Admin. Migrated to the real,
  // Rider-provisioned delivery.tracking.update (see #2Q-B1).
  describe('@RequirePermissions metadata (Task #2Q-B2 migration)', () => {
    it('POST /rider/gps requires exactly delivery.tracking.update, not the legacy system.create', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.updateGps);
      expect(metadata).toEqual(['delivery.tracking.update']);
    });

    it('GET /rider/gps/:orderId is untouched -- still requires delivery.tracking.read', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getRiderGps);
      expect(metadata).toEqual(['delivery.tracking.read']);
    });
  });

  describe('updateGps — identity binding (Task #2K)', () => {
    it('passes the authenticated user through to the service alongside the body', async () => {
      const body = { orderId: 900, lat: 1, lng: 2 };
      await controller.updateGps(RIDER_A_TOKEN, body as any);

      expect(service.updateRiderGps).toHaveBeenCalledWith(body, RIDER_A_TOKEN);
    });

    it('a spoofed body.riderId naming a different rider is still forwarded in the body (the service ignores it), but the authenticated user is what determines identity', async () => {
      const spoofedBody = { orderId: 901, lat: 1, lng: 2, riderId: '91' }; // Rider B's id
      await controller.updateGps(RIDER_A_TOKEN, spoofedBody as any);

      // The controller's contract with the service is (body, authenticatedUser) --
      // it's RiderService.updateRiderGps that must ignore body.riderId, which is
      // covered by the service-level Task #2K tests. Here we confirm the
      // authenticated identity is always passed as its own, separate argument.
      expect(service.updateRiderGps).toHaveBeenCalledWith(spoofedBody, RIDER_A_TOKEN);
      expect(service.updateRiderGps.mock.calls[0][1]).toBe(RIDER_A_TOKEN);
    });
  });
});

describe('RiderOrdersController', () => {
  let controller: RiderOrdersController;
  let service: { getRiderOrders: jest.Mock; claimOrder: jest.Mock };

  const RIDER_A_TOKEN = { sub: 90, store_id: 67 }; // shape of a real, verified JWT payload

  beforeEach(async () => {
    service = { getRiderOrders: jest.fn(), claimOrder: jest.fn().mockResolvedValue({ success: true }) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiderOrdersController],
      providers: [{ provide: RiderService, useValue: service }],
    }).compile();

    controller = module.get<RiderOrdersController>(RiderOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2Q-B2: system.view never matched any seeded permission or the
  // sales.* compatibility bridge -- confirmed in #2Q-A/#2Q-B this route was
  // reachable by nobody except Super Admin. Migrated to the real,
  // Rider-provisioned delivery.dispatch.claim (see #2Q-B1).
  describe('@RequirePermissions metadata (Task #2Q-B2 migration)', () => {
    it('GET /rider-orders is untouched -- still requires delivery.tracking.read', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getRiderOrders);
      expect(metadata).toEqual(['delivery.tracking.read']);
    });

    it('PATCH /rider-orders/:id/claim requires exactly delivery.dispatch.claim, not the legacy system.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.claimOrder);
      expect(metadata).toEqual(['delivery.dispatch.claim']);
    });
  });

  describe('claimOrder — identity binding (Task #2J)', () => {
    it('derives the claiming identity from the authenticated user (CurrentUser), passing it straight through to the service', async () => {
      await controller.claimOrder(RIDER_A_TOKEN, '123', { riderId: 90, riderName: 'Anees' });

      expect(service.claimOrder).toHaveBeenCalledWith(123, RIDER_A_TOKEN);
    });

    it('a client-supplied body.riderId naming a DIFFERENT rider is never forwarded to the service -- only the authenticated user is', async () => {
      const spoofedBody = { riderId: 91, riderName: 'Someone Else' }; // Rider B's id, sent by Rider A's client
      await controller.claimOrder(RIDER_A_TOKEN, '124', spoofedBody);

      expect(service.claimOrder).toHaveBeenCalledWith(124, RIDER_A_TOKEN);
      expect(service.claimOrder).toHaveBeenCalledTimes(1);
      // The service call must not contain the spoofed body anywhere in its arguments.
      const calledWith = service.claimOrder.mock.calls[0];
      expect(calledWith).not.toContain(spoofedBody);
      expect(JSON.stringify(calledWith)).not.toContain('91');
      expect(JSON.stringify(calledWith)).not.toContain('Someone Else');
    });

    it('an omitted body.riderId does not change the call at all -- identity comes from CurrentUser regardless', async () => {
      await controller.claimOrder(RIDER_A_TOKEN, '125', {} as any);
      expect(service.claimOrder).toHaveBeenCalledWith(125, RIDER_A_TOKEN);
    });
  });
});
