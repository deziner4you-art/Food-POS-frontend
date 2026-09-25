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
    business_day_id: 88,
    printCount: 0,
  };

  beforeEach(async () => {
    prisma = {
      kOT: {
        update: jest.fn(),
        findUnique: jest.fn().mockImplementation(({ where }: { where: { id: number } }) => {
          return Promise.resolve({ ...baseKot, id: where.id, status: 'NEW' });
        }),
      },
      order: { update: jest.fn() },
      onlineOrder: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((cb) => cb(prisma)),
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
    beforeEach(() => {
      prisma.kOT.findUnique.mockResolvedValue({ ...baseKot, status: 'NEW' });
    });

    it('rejects acceptKOT if ticket is not NEW (e.g. already READY or PREPARING)', async () => {
      prisma.kOT.findUnique.mockResolvedValue({ ...baseKot, status: 'READY' });
      await expect(service.acceptKOT(42)).rejects.toThrow('Invalid KOT status transition');
    });

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
        business_day_id: 88,
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
    beforeEach(() => {
      prisma.kOT.findUnique.mockResolvedValue({ ...baseKot, status: 'PREPARING' });
    });

    it('rejects direct bumpKOT when ticket is NEW (Codex Finding #1 direct bypass guard)', async () => {
      prisma.kOT.findUnique.mockResolvedValue({ ...baseKot, status: 'NEW' });
      await expect(service.bumpKOT(42)).rejects.toThrow('Invalid KOT status transition');
    });

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
        business_day_id: 88,
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
  describe('Phase 16 — KOT Isolation & Online Order Status Chain Regressions', () => {
    it('accepting a KOT targets only the specified KOT id without affecting other KOTs', async () => {
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        id: 42,
        status: 'PREPARING',
        order: { order_source: 'WALKIN' },
      });

      await service.acceptKOT(42);

      expect(prisma.kOT.update).toHaveBeenCalledTimes(1);
      expect(prisma.kOT.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 42 },
          data: expect.objectContaining({ status: 'PREPARING' }),
        }),
      );
    });

    it('broadcasting order_updated to store room when online order status changes to KITCHEN_PREPARING', async () => {
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'PREPARING',
        order: { order_source: 'ONLINE' },
      });
      const onlineOrder = { id: 501, status: 'KITCHEN_PREPARING', store_id: 67 };
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 501 });
      prisma.onlineOrder.update.mockResolvedValue(onlineOrder);

      await service.acceptKOT(42);

      expect(gateway.broadcast).toHaveBeenCalledWith('order_updated', onlineOrder, 'store_67');
    });

    it('broadcasting order_updated to store room when online order status changes to READY', async () => {
      prisma.kOT.findUnique.mockResolvedValue({ ...baseKot, status: 'PREPARING' });
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'READY',
        order: { order_source: 'ONLINE' },
      });
      const onlineOrder = { id: 501, status: 'READY', store_id: 67 };
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 501 });
      prisma.onlineOrder.update.mockResolvedValue(onlineOrder);

      await service.bumpKOT(42);

      expect(gateway.broadcast).toHaveBeenCalledWith('order_updated', onlineOrder, 'store_67');
    });
  });

  describe('updateKotStatus — Transaction Atomicity & Post-Commit Emission (Finding #7)', () => {
    it('executes database updates within a Prisma transaction', async () => {
      prisma.kOT.findUnique.mockResolvedValue({ ...baseKot, status: 'PREPARING' });
      prisma.kOT.update.mockResolvedValue({
        ...baseKot,
        status: 'READY',
        order: { order_source: 'ONLINE' },
      });
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 502 });
      prisma.onlineOrder.update.mockResolvedValue({ id: 502, status: 'READY', store_id: 67 });

      await service.bumpKOT(42);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.kOT.update).toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalled();
      expect(prisma.onlineOrder.update).toHaveBeenCalled();
      expect(gateway.broadcast).toHaveBeenCalledWith('kds_update', expect.any(Object));
    });

    it('if transaction fails / throws, no socket events are broadcast and error propagates', async () => {
      prisma.kOT.findUnique.mockResolvedValue({ ...baseKot, status: 'PREPARING' });
      prisma.$transaction.mockRejectedValue(new Error('DB Deadlock / Disk Failure'));

      await expect(service.bumpKOT(42)).rejects.toThrow('DB Deadlock / Disk Failure');
      // Critical check: no socket emissions if transaction failed
      expect(gateway.broadcast).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task #3B / #3B-1 — Backend Active KOT Identity & Store Isolation Gate
//
// These tests verify the WHERE clause that getActiveKots() constructs by
// intercepting prisma.kOT.findMany and inspecting its `where` argument.
// They are BEHAVIORAL: they confirm store isolation and business-day gating.
// ─────────────────────────────────────────────────────────────────────────────
describe('KotsService.getActiveKots — Task #3B Identity Gate', () => {
  let service: KotsService;
  let prisma: any;
  let gateway: { broadcast: jest.Mock };

  beforeEach(async () => {
    prisma = {
      kOT: { findMany: jest.fn().mockResolvedValue([]) },
      businessDay: { findFirst: jest.fn() },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };
    gateway = { broadcast: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        KotsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<KotsService>(KotsService);
  });

  it('open BD exists → query scoped to business_day_id = openDay.id (NOT null)', async () => {
    prisma.businessDay.findFirst.mockResolvedValue({ id: 5, dayStart: new Date() });

    await service.getActiveKots(2);

    const whereArg = prisma.kOT.findMany.mock.calls[0][0].where;
    const json = JSON.stringify(whereArg);
    expect(json).toContain('"business_day_id":5');
    expect(json).not.toMatch(/"business_day_id":null/);
  });

  it('open BD exists → null business_day_id branch is NOT in the WHERE clause', async () => {
    prisma.businessDay.findFirst.mockResolvedValue({ id: 5, dayStart: new Date() });

    await service.getActiveKots(2);

    const whereArg = prisma.kOT.findMany.mock.calls[0][0].where;
    const json = JSON.stringify(whereArg);
    expect(json).not.toMatch(/"business_day_id":null/);
  });

  it('query uses only the open BD id (openDay.id=8), not a different value', async () => {
    prisma.businessDay.findFirst.mockResolvedValue({ id: 8, dayStart: new Date() });

    await service.getActiveKots(3);

    const whereArg = prisma.kOT.findMany.mock.calls[0][0].where;
    const json = JSON.stringify(whereArg);
    expect(json).toContain('"business_day_id":8');
    expect(json).not.toContain('"business_day_id":5');
    expect(json).not.toContain('"business_day_id":99');
  });
});

describe('KotsService.getActiveKots — Task #3B-1 GAP 1: Store Isolation (1–4, A–E)', () => {
  let service: KotsService;
  let prisma: any;
  let gateway: { broadcast: jest.Mock };

  beforeEach(async () => {
    prisma = {
      kOT: { findMany: jest.fn().mockResolvedValue([]) },
      businessDay: { findFirst: jest.fn() },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };
    gateway = { broadcast: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        KotsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<KotsService>(KotsService);
  });

  it('1 / A: valid store_id → store filter present in WHERE clause and queries only that store', async () => {
    prisma.businessDay.findFirst.mockResolvedValue({ id: 5, dayStart: new Date() });

    await service.getActiveKots(2);

    expect(prisma.kOT.findMany).toHaveBeenCalledTimes(1);
    const whereArg = prisma.kOT.findMany.mock.calls[0][0].where;
    expect(whereArg.store_id).toBe(2);
  });

  it('2 / B: missing store_id (undefined / null) → rejected safely with BadRequestException', async () => {
    await expect(service.getActiveKots(undefined as any)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    await expect(service.getActiveKots(null as any)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  it('3 / C: store_id = 0 → rejected safely with BadRequestException', async () => {
    await expect(service.getActiveKots(0)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  it('4 / D: invalid/NaN store_id → rejected safely with BadRequestException', async () => {
    await expect(service.getActiveKots(NaN)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    await expect(service.getActiveKots('invalid' as any)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    await expect(service.getActiveKots(-5)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  it('E: another store (e.g. store_id = 3) → queries store 3, never includes store 2', async () => {
    prisma.businessDay.findFirst.mockResolvedValue({ id: 5, dayStart: new Date() });

    await service.getActiveKots(3);

    const whereArg = prisma.kOT.findMany.mock.calls[0][0].where;
    expect(whereArg.store_id).toBe(3);
    expect(whereArg.store_id).not.toBe(2);
    expect(JSON.stringify(whereArg)).not.toContain('"store_id":2');
  });
});

describe('KotsService.getActiveKots — Task #3B-1 GAP 3: Safe No-Open-Day Handling (5–6)', () => {
  let service: KotsService;
  let prisma: any;
  let gateway: { broadcast: jest.Mock };

  beforeEach(async () => {
    prisma = {
      kOT: { findMany: jest.fn().mockResolvedValue([]) },
      businessDay: { findFirst: jest.fn() },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };
    gateway = { broadcast: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        KotsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<KotsService>(KotsService);
  });

  it('5: no open BusinessDay → returns zero active KOTs ([])', async () => {
    prisma.businessDay.findFirst.mockResolvedValue(null);

    const result = await service.getActiveKots(2);

    expect(result).toEqual([]);
  });

  it('6: no open BusinessDay → prisma.kOT.findMany NOT called, no -1 sentinel used', async () => {
    prisma.businessDay.findFirst.mockResolvedValue(null);

    await service.getActiveKots(2);

    // GAP 3: Must NOT execute findMany with a -1 sentinel or any other query
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });
});

describe('KotsService.getActiveKots — Task #3B-2 Strict store_id Integer Validation (1–13)', () => {
  let service: KotsService;
  let prisma: any;
  let gateway: { broadcast: jest.Mock };

  beforeEach(async () => {
    prisma = {
      kOT: { findMany: jest.fn().mockResolvedValue([]) },
      businessDay: { findFirst: jest.fn().mockResolvedValue({ id: 5, dayStart: new Date() }) },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };
    gateway = { broadcast: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        KotsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<KotsService>(KotsService);
  });

  // 1. 1 → accepted
  it('1: 1 → accepted and produces store_id = 1 in Prisma WHERE clause', async () => {
    await service.getActiveKots(1);
    expect(prisma.businessDay.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ store_id: 1 }) }),
    );
    expect(prisma.kOT.findMany).toHaveBeenCalledTimes(1);
    const whereArg = prisma.kOT.findMany.mock.calls[0][0].where;
    expect(whereArg.store_id).toBe(1);
  });

  // 2. 2 → accepted
  it('2: 2 → accepted and produces store_id = 2 in Prisma WHERE clause', async () => {
    await service.getActiveKots(2);
    expect(prisma.businessDay.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ store_id: 2 }) }),
    );
    expect(prisma.kOT.findMany).toHaveBeenCalledTimes(1);
    const whereArg = prisma.kOT.findMany.mock.calls[0][0].where;
    expect(whereArg.store_id).toBe(2);
  });

  // 3. positive integer → accepted
  it('3: positive integer (e.g. 42) → accepted and produces store_id = 42 in Prisma WHERE clause', async () => {
    await service.getActiveKots(42);
    expect(prisma.businessDay.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ store_id: 42 }) }),
    );
    expect(prisma.kOT.findMany).toHaveBeenCalledTimes(1);
    const whereArg = prisma.kOT.findMany.mock.calls[0][0].where;
    expect(whereArg.store_id).toBe(42);
  });

  // 4. 0 → rejected
  it('4: 0 → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(0)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 5. -1 → rejected
  it('5: -1 → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(-1)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 6. 2.5 → rejected
  it('6: 2.5 → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(2.5)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 7. 1.1 → rejected
  it('7: 1.1 → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(1.1)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 8. NaN → rejected
  it('8: NaN → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(NaN)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 9. Infinity → rejected
  it('9: Infinity → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(Infinity)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 10. -Infinity → rejected
  it('10: -Infinity → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(-Infinity)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 11. "1" → rejected
  it('11: "1" (string) → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots('1' as any)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 12. null → rejected
  it('12: null → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(null as any)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 13. undefined → rejected
  it('13: undefined → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(undefined as any)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 14. true → rejected
  it('14: true (boolean) → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(true as any)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 15. false → rejected
  it('15: false (boolean) → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots(false as any)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 16. {} → rejected
  it('16: {} (object) → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots({} as any)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });

  // 17. [] → rejected
  it('17: [] (array) → rejected BEFORE businessDay.findFirst and kOT.findMany', async () => {
    await expect(service.getActiveKots([] as any)).rejects.toThrow(
      'A valid store_id is required to fetch active KOTs',
    );
    expect(prisma.businessDay.findFirst).not.toHaveBeenCalled();
    expect(prisma.kOT.findMany).not.toHaveBeenCalled();
  });
});
