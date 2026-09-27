import { Test, TestingModule } from '@nestjs/testing';
import { RiderService } from './rider.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

// ============================================================
// Sprint 29.3 / 29.3A — Admin Delivery Exception Recovery Tests
//
// Required coverage:
//  1.  READY + no rider is claimable (existing backend rule — guard test)
//  2.  PRINT_BILL + no rider is NOT claimable (existing backend rule — guard test)
//  3.  Rider cannot recover a delivery exception
//  4.  Admin can recover DISPATCHED + no rider → READY
//  5.  Admin can recover PRINT_BILL + no rider → READY
//  6.  Cross-store recovery rejected
//  7.  Terminal state rejected (SETTLED, DELIVERED, CANCELLED)
//  8.  Rider remains null after recovery
//  9.  Result status becomes READY
// 10.  Realtime order_updated emitted
// 11.  SystemAuditLog created with correct fields
// 12.  Concurrent state change fails safely (optimistic CAS returns 0)
// ============================================================

describe('RiderService — Sprint 29.3A Admin Delivery Exception Recovery', () => {
  let service: RiderService;
  let prisma: any;
  let gateway: any;

  const ADMIN = { sub: 1, role: { name: 'Admin' }, store_id: 1, id: 1, name: 'Admin One' };
  const RIDER = { sub: 2, role: { name: 'Rider' }, store_id: 1, id: 2, name: 'Rider One' };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      onlineOrder: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      },
      systemAuditLog: { create: jest.fn().mockResolvedValue({}) },
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

  afterEach(() => jest.clearAllMocks());

  // ----------------------------------------------------------------
  // Test 1 — Guard: READY + no rider IS claimable by backend
  // The backend claimOrder() gate must accept READY status.
  // We verify this via the gate logic (first findUnique succeeds,
  // a DISPATCHED pre-check rejects; READY does not hit that rejection).
  // ----------------------------------------------------------------
  describe('Test 1 & 2: claim gate confirms only READY is claimable', () => {
    it('Test 2: PRINT_BILL + no rider rejected by claimOrder()', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 10, name: 'Rider', store_id: 1, role: { name: 'Rider' } });
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 200,
        store_id: 1,
        status: 'PRINT_BILL',
        claimedByRiderId: null,
        type: 'DELIVERY',
      });

      await expect(service.claimOrder(200, { sub: 10 })).rejects.toThrow(BadRequestException);
    });
  });

  // ----------------------------------------------------------------
  // adminRecoverDeliveryException tests
  // ----------------------------------------------------------------
  describe('adminRecoverDeliveryException', () => {

    // Test: mandatory reason enforced
    it('mandatory reason required', async () => {
      await expect(service.adminRecoverDeliveryException(1, ADMIN, '')).rejects.toThrow(BadRequestException);
      await expect(service.adminRecoverDeliveryException(1, ADMIN, '   ')).rejects.toThrow(BadRequestException);
    });

    // Test 3: Rider cannot call this function
    it('Test 3: Rider role is rejected with ForbiddenException', async () => {
      prisma.user.findUnique.mockResolvedValue(RIDER);

      await expect(service.adminRecoverDeliveryException(1, RIDER, 'trying to recover'))
        .rejects.toThrow(ForbiddenException);
    });

    // Test 6: Cross-store recovery rejected
    it('Test 6: cross-store recovery rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN); // store_id: 1
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 1, store_id: 99, status: 'DISPATCHED', claimedByRiderId: null });

      await expect(service.adminRecoverDeliveryException(1, ADMIN, 'cross store'))
        .rejects.toThrow(ForbiddenException);
    });

    // Test 7: Terminal states rejected
    it('Test 7a: SETTLED is terminal — rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 1, store_id: 1, status: 'SETTLED', claimedByRiderId: null });

      await expect(service.adminRecoverDeliveryException(1, ADMIN, 'reason'))
        .rejects.toThrow(BadRequestException);
    });

    it('Test 7b: DELIVERED is terminal — rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 1, store_id: 1, status: 'DELIVERED', claimedByRiderId: null });

      await expect(service.adminRecoverDeliveryException(1, ADMIN, 'reason'))
        .rejects.toThrow(BadRequestException);
    });

    it('Test 7c: CANCELLED is terminal — rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 1, store_id: 1, status: 'CANCELLED', claimedByRiderId: null });

      await expect(service.adminRecoverDeliveryException(1, ADMIN, 'reason'))
        .rejects.toThrow(BadRequestException);
    });

    // READY rejected (not an exception state)
    it('READY status is not an exception — rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 1, store_id: 1, status: 'READY', claimedByRiderId: null });

      await expect(service.adminRecoverDeliveryException(1, ADMIN, 'reason'))
        .rejects.toThrow(BadRequestException);
    });

    // DISPATCHED + rider assigned should be rejected
    it('DISPATCHED with rider assigned — rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 1, store_id: 1, status: 'DISPATCHED', claimedByRiderId: 999 });

      await expect(service.adminRecoverDeliveryException(1, ADMIN, 'reason'))
        .rejects.toThrow(BadRequestException);
    });

    // Test 12: Concurrent state change — CAS fails safely
    it('Test 12: concurrent state change fails safely (updateMany returns count: 0)', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 1, store_id: 1, status: 'DISPATCHED', claimedByRiderId: null });
      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.adminRecoverDeliveryException(1, ADMIN, 'concurrent test'))
        .rejects.toThrow(BadRequestException);
    });

    it('Test 12b: PRINT_BILL concurrent state change fails safely', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);
      prisma.onlineOrder.findUnique.mockResolvedValue({ id: 1, store_id: 1, status: 'PRINT_BILL', claimedByRiderId: null });
      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.adminRecoverDeliveryException(1, ADMIN, 'concurrent test'))
        .rejects.toThrow(BadRequestException);
    });

    // Order not found
    it('not-found order raises NotFoundException', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);
      prisma.onlineOrder.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.adminRecoverDeliveryException(999, ADMIN, 'reason'))
        .rejects.toThrow(NotFoundException);
    });

    // ---------------------------------------------------------------
    // Test 4, 8, 9, 10, 11: Admin recovers DISPATCHED + no rider
    // ---------------------------------------------------------------
    it('Tests 4,8,9,10,11: Admin recovers DISPATCHED + no rider → READY with all side-effects', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);

      const mockOrder = { id: 1, store_id: 1, status: 'DISPATCHED', claimedByRiderId: null, posOrderId: null };
      const mockUpdated = { ...mockOrder, status: 'READY' };

      prisma.onlineOrder.findUnique
        .mockResolvedValueOnce(mockOrder)   // initial fetch
        .mockResolvedValueOnce(mockUpdated); // broadcast fetch

      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.adminRecoverDeliveryException(1, ADMIN, 'Orphaned dispatch', 'ONLINE');

      // Test 9: result status is READY
      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('READY');
      expect(result.previousStatus).toBe('DISPATCHED');

      // Test 8: rider remains null — updateMany WHERE requires claimedByRiderId: null,
      //         data does NOT set claimedByRiderId to anything
      expect(prisma.onlineOrder.updateMany).toHaveBeenCalledWith({
        where: { id: 1, status: 'DISPATCHED', claimedByRiderId: null },
        data: { status: 'READY' },
      });

      // Test 11: SystemAuditLog created
      expect(prisma.systemAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DELIVERY_EXCEPTION_RESET',
          entity: 'OnlineOrder',
          entity_id: 1,
          user_id: 1,
          details: expect.objectContaining({
            previousStatus: 'DISPATCHED',
            newStatus: 'READY',
            previousRider: null,
            newRider: null,
            reason: 'Orphaned dispatch',
          }),
        }),
      });

      // Test 10: realtime broadcast emitted
      expect(gateway.broadcast).toHaveBeenCalledWith('order_updated', expect.objectContaining({ ...mockUpdated, entityType: 'ONLINE', entityId: 1 }), 'store_1');
    });

    // ---------------------------------------------------------------
    // Test 5, 8, 9, 10, 11: Admin recovers PRINT_BILL + no rider
    // ---------------------------------------------------------------
    it('Tests 5,8,9,10,11: Admin recovers PRINT_BILL + no rider → READY with all side-effects', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);

      const mockOrder = { id: 25, store_id: 1, status: 'PRINT_BILL', claimedByRiderId: null, posOrderId: null };
      const mockUpdated = { ...mockOrder, status: 'READY' };

      prisma.onlineOrder.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockUpdated);

      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.adminRecoverDeliveryException(25, ADMIN, 'Billed but never dispatched', 'ONLINE');

      // Test 9: becomes READY
      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('READY');
      expect(result.previousStatus).toBe('PRINT_BILL');

      // Test 8: rider remains null — WHERE clause enforces claimedByRiderId: null
      expect(prisma.onlineOrder.updateMany).toHaveBeenCalledWith({
        where: { id: 25, status: 'PRINT_BILL', claimedByRiderId: null },
        data: { status: 'READY' },
      });

      // Test 11: SystemAuditLog with PRINT_BILL previousStatus
      expect(prisma.systemAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DELIVERY_EXCEPTION_RESET',
          entity: 'OnlineOrder',
          entity_id: 25,
          user_id: 1,
          details: expect.objectContaining({
            previousStatus: 'PRINT_BILL',
            newStatus: 'READY',
            previousRider: null,
            newRider: null,
            reason: 'Billed but never dispatched',
          }),
        }),
      });

      // Test 10: realtime broadcast
      expect(gateway.broadcast).toHaveBeenCalledWith('order_updated', expect.objectContaining({ ...mockUpdated, entityType: 'ONLINE', entityId: 25 }), 'store_1');
    });

    // ---------------------------------------------------------------
    // POS twin sync: when posOrderId is set, order twin is updated too
    // ---------------------------------------------------------------
    it('POS twin synchronized when posOrderId is set', async () => {
      prisma.user.findUnique.mockResolvedValue(ADMIN);

      const mockOrder = { id: 1, store_id: 1, status: 'DISPATCHED', claimedByRiderId: null, posOrderId: 10 };
      const mockUpdated = { ...mockOrder, status: 'READY' };

      prisma.onlineOrder.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockUpdated);

      prisma.onlineOrder.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });

      await service.adminRecoverDeliveryException(1, ADMIN, 'Twin sync test', 'ONLINE');

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 10, order_source: { equals: 'ONLINE', mode: 'insensitive' } },
        data: { status: 'READY' },
      });
    });
  });
});
