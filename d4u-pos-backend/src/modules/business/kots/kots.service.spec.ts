import { Test, TestingModule } from '@nestjs/testing';
import { KotsService } from './kots.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';

// Task #2P-G: acceptKOT/bumpKOT/cancelKOT are thin, status-locked wrappers
// around the pre-existing updateKotStatus -- these tests prove each wrapper
// produces exactly the same database writes and broadcasts as calling
// updateKotStatus(id, <literal>) directly, i.e. the route split changed
// only *authorization*, never business behavior. They also confirm each
// wrapper is hard-locked to its own status literal -- there is no
// client-reachable path for acceptKOT to produce READY/CANCELLED behavior,
// or bumpKOT to produce PREPARING behavior, and so on.
describe('KotsService — accept/bump/cancel (Task #2P-G)', () => {
  let service: KotsService;
  let prisma: any;
  let gateway: { broadcast: jest.Mock };

  const baseKot = {
    id: 42,
    order_id: 900,
    store_id: 67,
    printCount: 0,
  };

  beforeEach(async () => {
    prisma = {
      kOT: { update: jest.fn() },
      order: { update: jest.fn() },
      onlineOrder: { findUnique: jest.fn(), update: jest.fn() },
    };
    gateway = { broadcast: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KotsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<KotsService>(KotsService);
  });

  describe('acceptKOT — identical to updateKotStatus(id, "PREPARING")', () => {
    it('updates KOT.status=PREPARING with acceptedAt stamped, and mirrors Order.status=PREPARING', async () => {
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'PREPARING',
        order: { order_source: 'WALKIN' },
      });

      await service.acceptKOT(42);

      expect(prisma.kOT.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { status: 'PREPARING', acceptedAt: expect.any(Date) },
        include: { order: true },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 900 },
        data: { status: 'PREPARING' },
      });
    });

    it('broadcasts kds_update with status PREPARING', async () => {
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'PREPARING',
        order: { order_source: 'WALKIN' },
      });

      await service.acceptKOT(42);

      expect(gateway.broadcast).toHaveBeenCalledWith('kds_update', {
        kot_id: 42,
        order_id: 900,
        status: 'PREPARING',
        store_id: 67,
      });
    });

    it('mirrors a linked ONLINE order to KITCHEN_PREPARING (matches the old PREPARING path exactly)', async () => {
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'PREPARING',
        order: { order_source: 'ONLINE' },
      });
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 501 });
      prisma.onlineOrder.update.mockResolvedValue({ id: 501, status: 'KITCHEN_PREPARING' });

      await service.acceptKOT(42);

      expect(prisma.onlineOrder.update).toHaveBeenCalledWith({
        where: { id: 501 },
        data: { status: 'KITCHEN_PREPARING', kdsStatus: 'PREPARING' },
      });
    });

    it('never produces READY or CANCELLED behavior -- the literal status passed is always PREPARING', async () => {
      prisma.kOT.update.mockResolvedValue({ ...baseKot, status: 'PREPARING', order: { order_source: 'WALKIN' } });
      await service.acceptKOT(42);
      const dataArg = prisma.kOT.update.mock.calls[0][0].data;
      expect(dataArg.status).toBe('PREPARING');
      expect(dataArg.readyAt).toBeUndefined();
    });
  });

  describe('bumpKOT — identical to updateKotStatus(id, "READY")', () => {
    it('updates KOT.status=READY with readyAt stamped, and mirrors Order.status=READY', async () => {
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'READY',
        order: { order_source: 'WALKIN' },
      });

      await service.bumpKOT(42);

      expect(prisma.kOT.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { status: 'READY', readyAt: expect.any(Date) },
        include: { order: true },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 900 },
        data: { status: 'READY' },
      });
    });

    it('broadcasts a Rider-facing delivery offer for a POS-native DELIVERY order (matches the old READY path exactly)', async () => {
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'READY',
        order: { order_source: 'DELIVERY' },
      });
      prisma.onlineOrder.findUnique.mockResolvedValue(null); // not website-linked
      const fullOrder = {
        id: 900,
        store_id: 67,
        items: [],
        customer: null,
        createdAt: new Date(),
        total_amount: 500,
        rider_id: null,
        rider: null,
      };
      // getOrder-equivalent lookup used inside the READY branch
      prisma.order.findUnique = jest.fn().mockResolvedValue(fullOrder);

      await service.bumpKOT(42);

      expect(gateway.broadcast).toHaveBeenCalledWith('order_updated', expect.any(Object), 'store_67');
    });

    it('mirrors a linked ONLINE order to READY (matches the old READY path exactly)', async () => {
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'READY',
        order: { order_source: 'ONLINE' },
      });
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 501 });
      prisma.onlineOrder.update.mockResolvedValue({ id: 501, status: 'READY' });

      await service.bumpKOT(42);

      expect(prisma.onlineOrder.update).toHaveBeenCalledWith({
        where: { id: 501 },
        data: { status: 'READY', kdsStatus: 'READY' },
      });
    });

    it('never produces PREPARING or CANCELLED behavior -- the literal status passed is always READY', async () => {
      prisma.kOT.update.mockResolvedValue({ ...baseKot, status: 'READY', order: { order_source: 'WALKIN' } });
      await service.bumpKOT(42);
      const dataArg = prisma.kOT.update.mock.calls[0][0].data;
      expect(dataArg.status).toBe('READY');
      expect(dataArg.acceptedAt).toBeUndefined();
    });
  });

  describe('cancelKOT — identical to updateKotStatus(id, "CANCELLED")', () => {
    it('updates KOT.status=CANCELLED only -- no acceptedAt/readyAt, and does NOT touch Order.status', async () => {
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'CANCELLED',
        order: { order_source: 'WALKIN' },
      });

      await service.cancelKOT(42);

      expect(prisma.kOT.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { status: 'CANCELLED' },
        include: { order: true },
      });
      // The underlying Order is never touched for CANCELLED -- confirmed in
      // Task #2P-C: cancelling a ticket does not cancel the order.
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('still broadcasts kds_update (the one unconditional broadcast) but no order_updated broadcast', async () => {
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'CANCELLED',
        order: { order_source: 'DELIVERY' },
      });

      await service.cancelKOT(42);

      expect(gateway.broadcast).toHaveBeenCalledWith('kds_update', {
        kot_id: 42,
        order_id: 900,
        status: 'CANCELLED',
        store_id: 67,
      });
      expect(gateway.broadcast).not.toHaveBeenCalledWith('order_updated', expect.anything(), expect.anything());
    });

    it('never produces PREPARING or READY behavior -- the literal status passed is always CANCELLED', async () => {
      prisma.kOT.update.mockResolvedValue({ ...baseKot, status: 'CANCELLED', order: { order_source: 'WALKIN' } });
      await service.cancelKOT(42);
      const dataArg = prisma.kOT.update.mock.calls[0][0].data;
      expect(dataArg.status).toBe('CANCELLED');
      expect(dataArg.acceptedAt).toBeUndefined();
      expect(dataArg.readyAt).toBeUndefined();
    });
  });

  // Task #2P-C established that updateKotStatus never performed its own
  // tenant/store validation (no validateTenantAccess call, no @CurrentUser
  // dependency) -- authorization was, and remains, purely RBAC-based via
  // the controller's @RequirePermissions decorator. The route split does
  // not add or remove any tenant check, preserving this exactly.
  describe('no tenant/store validation was added by the route split', () => {
    it('acceptKOT/bumpKOT/cancelKOT take only a numeric id -- no user/store parameter exists to validate', () => {
      expect(service.acceptKOT.length).toBe(1);
      expect(service.bumpKOT.length).toBe(1);
      expect(service.cancelKOT.length).toBe(1);
    });
  });
});
