import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { RiderService } from './rider.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';

describe('RiderService', () => {
  let service: RiderService;
  let prisma: any;
  let gateway: any;

  const RIDER_A = { id: 90, name: 'Anees', store_id: 67, role: { name: 'Rider' } };
  const RIDER_B_ID = 91; // a different, real rider -- never the authenticated caller in these tests

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      onlineOrder: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), updateMany: jest.fn(), update: jest.fn(), findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn() },
      order: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), updateMany: jest.fn(), update: jest.fn(), findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn() },
    };
    gateway = { broadcast: jest.fn(), broadcastRiderPresence: jest.fn(), getActiveRidersList: jest.fn().mockReturnValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiderService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<RiderService>(RiderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('claimOrder — identity binding & delivery isolation (Task #2J & Finding #2)', () => {
    it('1. authenticated Rider A claiming an available (POS) order -> allowed, and the DB update uses Rider A\'s own id', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null); // not an online order
      prisma.order.findUnique.mockResolvedValueOnce({ store_id: 67, status: 'READY', order_source: 'DELIVERY' }); // store-match lookup
      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 0 });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        id: 500, store_id: 67, order_source: 'DELIVERY', items: [], createdAt: new Date(), total_amount: 100, rider_id: RIDER_A.id,
      });

      const result = await service.claimOrder(500, { sub: RIDER_A.id });

      expect(result.success).toBe(true);
      // The actual identity written to the database must be Rider A's.
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 500, rider_id: null, status: 'READY', order_source: { equals: 'DELIVERY', mode: 'insensitive' }, store_id: 67 },
        data: { rider_id: RIDER_A.id },
      });
    });

    it('2. a client-supplied riderId belonging to a different rider is never consulted -- claimOrder no longer accepts it as an argument at all', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValueOnce({ store_id: 67, status: 'READY', order_source: 'DELIVERY' });
      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 0 });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        id: 501, store_id: 67, order_source: 'DELIVERY', items: [], createdAt: new Date(), total_amount: 100, rider_id: RIDER_A.id,
      });

      // Even if a caller tried to smuggle Rider B's id in some other way, the
      // method signature only accepts the authenticated user object -- there
      // is no parameter through which RIDER_B_ID could reach the database.
      await service.claimOrder(501, { sub: RIDER_A.id });

      const dbCallArgs = prisma.order.updateMany.mock.calls[0][0];
      expect(dbCallArgs.data.rider_id).toBe(RIDER_A.id);
      expect(dbCallArgs.data.rider_id).not.toBe(RIDER_B_ID);
      // Rider B's id must never appear anywhere in the Prisma call.
      expect(JSON.stringify(prisma.order.updateMany.mock.calls)).not.toContain(String(RIDER_B_ID));
    });

    it('3. online-order claim also writes the server-resolved rider identity (id and name), not any client-supplied value', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValueOnce({ store_id: 67, status: 'READY', type: 'DELIVERY' }); // store-match lookup finds it as an online order
      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 1 });
      prisma.onlineOrder.findUniqueOrThrow.mockResolvedValue({ id: 700, store_id: 67 });

      await service.claimOrder(700, { sub: RIDER_A.id });

      expect(prisma.onlineOrder.updateMany).toHaveBeenCalledWith({
        where: { id: 700, claimedByRiderId: null, status: 'READY', type: { equals: 'DELIVERY', mode: 'insensitive' }, store_id: 67 },
        data: { claimedByRiderId: RIDER_A.id, claimedByRiderName: RIDER_A.name },
      });
    });

    it('3b. rejects claiming pre-READY orders (PENDING, CONFIRMED, KITCHEN_PREPARING)', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      for (const preReadyStatus of ['PENDING', 'CONFIRMED', 'KITCHEN_PREPARING']) {
        prisma.onlineOrder.findUnique.mockResolvedValueOnce({ id: 701, store_id: 67, status: preReadyStatus, type: 'DELIVERY' });
        await expect(service.claimOrder(701, { sub: RIDER_A.id })).rejects.toThrow(
          `Cannot claim Order #701: only READY orders can be claimed by a rider (current status: ${preReadyStatus}).`
        );
      }
    });

    it('3c. rejects claiming READY pickup OnlineOrder (Finding #2)', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValueOnce({ id: 702, store_id: 67, status: 'READY', type: 'PICKUP' });
      await expect(service.claimOrder(702, { sub: RIDER_A.id })).rejects.toThrow(BadRequestException);
    });

    it('3d. rejects claiming READY non-delivery POS order (WALKIN/DINE_IN) (Finding #2)', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValueOnce({ id: 703, store_id: 67, status: 'READY', order_source: 'WALKIN' });
      await expect(service.claimOrder(703, { sub: RIDER_A.id })).rejects.toThrow(BadRequestException);
    });

    it('3e. rejects claiming terminal orders (SETTLED / CANCELLED) (Finding #2)', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValueOnce({ id: 704, store_id: 67, status: 'SETTLED', type: 'DELIVERY' });
      await expect(service.claimOrder(704, { sub: RIDER_A.id })).rejects.toThrow(BadRequestException);
    });

    it('4. missing authenticated identity -> rejected safely, no database write attempted', async () => {
      await expect(service.claimOrder(1, undefined)).rejects.toThrow(BadRequestException);
      await expect(service.claimOrder(1, {})).rejects.toThrow(BadRequestException);
      await expect(service.claimOrder(1, { sub: 'terminal-session-42' })).rejects.toThrow(BadRequestException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
      expect(prisma.onlineOrder.updateMany).not.toHaveBeenCalled();
    });

    it('5. authenticated user exists but has no Rider profile (wrong role) -> rejected safely', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 61, name: 'Ali Cashier', store_id: 67, role: { name: 'Cashier' } });

      await expect(service.claimOrder(1, { sub: 61 })).rejects.toThrow(BadRequestException);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
      expect(prisma.onlineOrder.updateMany).not.toHaveBeenCalled();
    });

    it('5b. authenticated sub does not correspond to any real user -> rejected safely', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.claimOrder(1, { sub: 999999 })).rejects.toThrow(BadRequestException);
    });

    it('6. existing business-state rules are preserved: store mismatch still rejects', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A); // store_id 67
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValueOnce({ store_id: 99, status: 'READY', order_source: 'DELIVERY' }); // order belongs to a different store

      await expect(service.claimOrder(2, { sub: RIDER_A.id })).rejects.toThrow(BadRequestException);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('6b. existing business-state rules are preserved: already-claimed order still conflicts', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.findUnique
        .mockResolvedValueOnce({ store_id: 67, status: 'READY', order_source: 'DELIVERY' }) // store-match lookup
        .mockResolvedValueOnce({ id: 3 }); // post-claim-attempt existence check
      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 0 });
      prisma.order.updateMany.mockResolvedValue({ count: 0 }); // lost the race / already claimed

      await expect(service.claimOrder(3, { sub: RIDER_A.id })).rejects.toThrow(ConflictException);
    });

    it('6c. nonexistent order still 404s', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValueOnce(null); // store-match lookup finds nothing at all

      await expect(service.claimOrder(4, { sub: RIDER_A.id })).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRiderGps — identity binding (Task #2K)', () => {
    it('1. Rider A sends a GPS update -> tracking records Rider A\'s authenticated User.id', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null); // treated as a POS order
      prisma.order.update.mockResolvedValue({});

      const result = await service.updateRiderGps({ orderId: 900, lat: 24.9, lng: 67.1 }, { sub: RIDER_A.id });

      expect(result.success).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 900 },
        data: { delivery_info: expect.objectContaining({ riderId: RIDER_A.id, lat: 24.9, lng: 67.1 }) },
      });
    });

    it('2. Rider A sends body.riderId = Rider B -> tracking still records Rider A, never Rider B', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.update.mockResolvedValue({});

      await service.updateRiderGps({ orderId: 901, lat: 1, lng: 2, riderId: String(RIDER_B_ID) }, { sub: RIDER_A.id });

      const writtenData = prisma.order.update.mock.calls[0][0].data.delivery_info;
      expect(writtenData.riderId).toBe(RIDER_A.id);
      expect(writtenData.riderId).not.toBe(RIDER_B_ID);
      // Ensure the riderId field itself is not RIDER_B_ID (checking the field
      // directly is more reliable than JSON.stringify which can match substrings
      // in timestamps like "2026-09-19T13:45:11.914Z" containing "91").
      expect(writtenData.riderId).toStrictEqual(RIDER_A.id);
    });

    it('3. Rider A omits body.riderId -> tracking still records Rider A (identity never depended on the body field)', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.update.mockResolvedValue({});

      await service.updateRiderGps({ orderId: 902, lat: 1, lng: 2 }, { sub: RIDER_A.id });

      expect(prisma.order.update.mock.calls[0][0].data.delivery_info.riderId).toBe(RIDER_A.id);
    });

    it('4. missing authenticated identity -> rejected safely, no database write attempted', async () => {
      await expect(service.updateRiderGps({ orderId: 1, lat: 1, lng: 2 }, undefined)).rejects.toThrow(BadRequestException);
      await expect(service.updateRiderGps({ orderId: 1, lat: 1, lng: 2 }, {})).rejects.toThrow(BadRequestException);
      await expect(
        service.updateRiderGps({ orderId: 1, lat: 1, lng: 2 }, { sub: 'terminal-session-42' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    });

    it('5. no hardcoded \'R1\' fallback remains anywhere in the recorded identity', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.update.mockResolvedValue({});

      await service.updateRiderGps({ orderId: 903, lat: 1, lng: 2 }, { sub: RIDER_A.id });

      const writtenData = prisma.order.update.mock.calls[0][0].data.delivery_info;
      expect(writtenData.riderId).not.toBe('R1');
      expect(JSON.stringify(prisma.order.update.mock.calls)).not.toContain('R1');
    });

    it('5b. an authenticated user who is not a Rider is rejected, not defaulted to any identity', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 61, name: 'Ali Cashier', store_id: 67, role: { name: 'Cashier' } });
      await expect(service.updateRiderGps({ orderId: 1, lat: 1, lng: 2 }, { sub: 61 })).rejects.toThrow(BadRequestException);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('6. existing GPS update behavior (lat/lng/lastUpdated, online-order routing, broadcast) is unchanged apart from the identity source', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 904 }); // this one IS an online order
      prisma.onlineOrder.update.mockResolvedValue({});

      const result = await service.updateRiderGps({ orderId: 904, lat: 5, lng: 6, storeId: 67 }, { sub: RIDER_A.id });

      expect(prisma.onlineOrder.update).toHaveBeenCalledWith({
        where: { id: 904 },
        data: { delivery: expect.objectContaining({ riderId: RIDER_A.id, lat: 5, lng: 6, lastUpdated: expect.any(String) }) },
      });
      expect(gateway.broadcast).toHaveBeenCalledWith('gps_update', { orderId: 904, lat: 5, lng: 6 }, 'store_67');
      expect(result).toEqual({ success: true });
    });
    it('7. a rider with an active unfinished delivery cannot claim another order (Fix 6)', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValueOnce({ store_id: 67, status: 'READY', type: 'DELIVERY' });
      prisma.onlineOrder.findFirst.mockResolvedValueOnce({ id: 800, status: 'OUT_FOR_DELIVERY' });

      await expect(service.claimOrder(801, { sub: RIDER_A.id })).rejects.toThrow(ConflictException);
      expect(prisma.onlineOrder.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('getRiderOrders — delivery isolation (Finding #2)', () => {
    it('filters online orders strictly to type: DELIVERY', async () => {
      prisma.onlineOrder.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);

      await service.getRiderOrders('67');

      expect(prisma.onlineOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { equals: 'DELIVERY', mode: 'insensitive' },
            store_id: 67,
          }),
        }),
      );
    });
  });

  describe('Task #2 — Rider Single Active Delivery Concurrency', () => {
    it('Required Test A: same rider + two concurrent claim attempts -> exactly one succeeds, second gets ConflictException', async () => {
      // Simulate database state progression across serialized transactions enforced by User row lock
      let activeOrderClaimed: any = null;
      let txQueue = Promise.resolve();
      const rawLockQueries: any[] = [];

      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockImplementation(async ({ where }: any) => {
        return { id: where.id, store_id: 67, status: 'READY', type: 'DELIVERY' };
      });

      // Transaction runner executes sequentially as enforced by SELECT ... FOR UPDATE in PostgreSQL
      prisma.$transaction = jest.fn((callback) => {
        const next = txQueue.then(async () => {
          const tx = {
            $queryRaw: jest.fn(async (strings: any, ...values: any[]) => {
              rawLockQueries.push({ strings, values });
              return [{ id: values[0] }];
            }),
            onlineOrder: {
              findFirst: jest.fn(async () => activeOrderClaimed),
              updateMany: jest.fn(async ({ where }: any) => {
                activeOrderClaimed = { id: where.id, status: 'READY', claimedByRiderId: RIDER_A.id };
                return { count: 1 };
              }),
              findUniqueOrThrow: jest.fn(async ({ where }: any) => ({
                id: where.id,
                store_id: 67,
                status: 'READY',
                claimedByRiderId: RIDER_A.id,
              })),
              findUnique: jest.fn(async () => null),
            },
            order: {
              findFirst: jest.fn(async () => null),
              updateMany: jest.fn(async () => ({ count: 0 })),
              findUnique: jest.fn(async () => null),
            },
          };
          return callback(tx);
        });
        txQueue = next.catch(() => {});
        return next;
      });

      // Fire two claims simultaneously
      const results = await Promise.allSettled([
        service.claimOrder(901, { sub: RIDER_A.id }),
        service.claimOrder(902, { sub: RIDER_A.id }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
      expect((rejected[0] as PromiseRejectedResult).reason.message).toContain('Finish current delivery first');
      expect(activeOrderClaimed).not.toBeNull();
      expect(activeOrderClaimed.claimedByRiderId).toBe(RIDER_A.id);

      // Verify row lock was acquired on Rider A's User record
      expect(rawLockQueries.length).toBeGreaterThanOrEqual(1);
      expect(rawLockQueries[0].values[0]).toBe(RIDER_A.id);
    });

    it('Required Test B: different riders + two concurrent claim attempts -> both succeed independently', async () => {
      const RIDER_B = { id: 91, name: 'Babar', store_id: 67, role: { name: 'Rider' } };
      const rawLockQueries: any[] = [];

      prisma.user.findUnique.mockImplementation(async ({ where }: any) => {
        return where.id === RIDER_A.id ? RIDER_A : RIDER_B;
      });

      prisma.onlineOrder.findUnique.mockImplementation(async ({ where }: any) => {
        return { id: where.id, store_id: 67, status: 'READY', type: 'DELIVERY' };
      });

      prisma.$transaction = jest.fn(async (callback) => {
        const tx = {
          $queryRaw: jest.fn(async (strings: any, ...values: any[]) => {
            rawLockQueries.push({ strings, values });
            return [{ id: values[0] }];
          }),
          onlineOrder: {
            findFirst: jest.fn(async () => null), // Neither rider has an active order
            updateMany: jest.fn(async () => ({ count: 1 })),
            findUniqueOrThrow: jest.fn(async ({ where }: any) => ({
              id: where.id,
              store_id: 67,
              status: 'READY',
            })),
            findUnique: jest.fn(async () => null),
          },
          order: {
            findFirst: jest.fn(async () => null),
            updateMany: jest.fn(async () => ({ count: 0 })),
            findUnique: jest.fn(async () => null),
          },
        };
        return callback(tx);
      });

      const [resA, resB] = await Promise.all([
        service.claimOrder(903, { sub: RIDER_A.id }),
        service.claimOrder(904, { sub: RIDER_B.id }),
      ]);

      expect(resA.success).toBe(true);
      expect(resB.success).toBe(true);

      // Distinct row locks acquired on different riders
      const lockedIds = rawLockQueries.map((q) => q.values[0]);
      expect(lockedIds).toContain(RIDER_A.id);
      expect(lockedIds).toContain(RIDER_B.id);
    });

    it('Required Test C: same rider attempting another claim AFTER already having an active delivery -> rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockImplementation(async ({ where }: any) => {
        return { id: where.id, store_id: 67, status: 'READY', type: 'DELIVERY' };
      });

      prisma.$transaction = jest.fn(async (callback) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([{ id: RIDER_A.id }]),
          onlineOrder: {
            findFirst: jest.fn(async () => ({
              id: 888,
              status: 'OUT_FOR_DELIVERY',
              claimedByRiderId: RIDER_A.id,
            })),
            updateMany: jest.fn(),
            findUnique: jest.fn(),
          },
          order: {
            findFirst: jest.fn(async () => null),
            updateMany: jest.fn(),
            findUnique: jest.fn(),
          },
        };
        return callback(tx);
      });

      await expect(
        service.claimOrder(905, { sub: RIDER_A.id }),
      ).rejects.toThrow(ConflictException);
    });

    it('Required Test D: existing protections remain: non-READY rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);

      for (const nonReadyStatus of ['PENDING', 'CONFIRMED', 'KITCHEN_PREPARING']) {
        prisma.onlineOrder.findUnique.mockResolvedValueOnce({
          id: 906,
          store_id: 67,
          status: nonReadyStatus,
          type: 'DELIVERY',
        });
        await expect(
          service.claimOrder(906, { sub: RIDER_A.id }),
        ).rejects.toThrow(BadRequestException);
      }
    });
  });
});

