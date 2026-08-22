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
      onlineOrder: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
      order: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    };
    gateway = { broadcast: jest.fn() };

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

  describe('claimOrder — identity binding (Task #2J)', () => {
    it('1. authenticated Rider A claiming an available (POS) order -> allowed, and the DB update uses Rider A\'s own id', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null); // not an online order
      prisma.order.findUnique.mockResolvedValueOnce({ store_id: 67 }); // store-match lookup
      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 0 });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        id: 500, store_id: 67, order_source: 'POS', items: [], createdAt: new Date(), total_amount: 100, rider_id: RIDER_A.id,
      });

      const result = await service.claimOrder(500, { sub: RIDER_A.id });

      expect(result.success).toBe(true);
      // The actual identity written to the database must be Rider A's.
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 500, rider_id: null },
        data: { rider_id: RIDER_A.id },
      });
    });

    it('2. a client-supplied riderId belonging to a different rider is never consulted -- claimOrder no longer accepts it as an argument at all', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValueOnce({ store_id: 67 });
      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 0 });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        id: 501, store_id: 67, order_source: 'POS', items: [], createdAt: new Date(), total_amount: 100, rider_id: RIDER_A.id,
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
      prisma.onlineOrder.findUnique.mockResolvedValueOnce({ store_id: 67 }); // store-match lookup finds it as an online order
      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 1 });
      prisma.onlineOrder.findUniqueOrThrow.mockResolvedValue({ id: 700, store_id: 67 });

      await service.claimOrder(700, { sub: RIDER_A.id });

      expect(prisma.onlineOrder.updateMany).toHaveBeenCalledWith({
        where: { id: 700, claimedByRiderId: null },
        data: { claimedByRiderId: RIDER_A.id, claimedByRiderName: RIDER_A.name },
      });
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
      prisma.order.findUnique.mockResolvedValueOnce({ store_id: 99 }); // order belongs to a different store

      await expect(service.claimOrder(2, { sub: RIDER_A.id })).rejects.toThrow(BadRequestException);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('6b. existing business-state rules are preserved: already-claimed order still conflicts', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER_A);
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.findUnique
        .mockResolvedValueOnce({ store_id: 67 }) // store-match lookup
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
      expect(JSON.stringify(prisma.order.update.mock.calls)).not.toContain(String(RIDER_B_ID));
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
  });
});
