import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RiderService } from './rider.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';

describe('RiderService — adminForceReleaseRiderAssignment (Admin Recovery)', () => {
  let service: RiderService;
  let prisma: any;
  let gateway: any;

  const ADMIN_STORE_10 = { id: 1, name: 'Admin Ali', store_id: 10, role: { name: 'Branch Manager' } };
  const ADMIN_STORE_20 = { id: 2, name: 'Manager Usman', store_id: 20, role: { name: 'Manager' } };
  const SUPER_ADMIN = { id: 3, name: 'Super Admin', store_id: null, role: { name: 'Super Admin' } };
  const RIDER_CALLER = { id: 4, name: 'Rider Tariq', store_id: 10, role: { name: 'Rider' } };

  const createMockPosOrder = (overrides: any = {}) => ({
    id: 601,
    store_id: 10,
    rider_id: 101,
    status: 'OUT_FOR_DELIVERY',
    business_day_id: 5,
    items: [],
    customer: null,
    rider: { id: 101, name: 'Rider Tariq' },
    total_amount: 150,
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      onlineOrder: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
      },
      systemAuditLog: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };
    gateway = {
      broadcast: jest.fn(),
      broadcastRiderPresence: jest.fn(),
      getActiveRidersList: jest.fn().mockReturnValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiderService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<RiderService>(RiderService);
  });

  // 1. Authorized admin can force-release own-store OnlineOrder.
  it('1. Authorized admin can force-release own-store OnlineOrder', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 501,
      store_id: 10,
      claimedByRiderId: 101,
      claimedByRiderName: 'Rider Tariq',
      status: 'OUT_FOR_DELIVERY',
    });
    prisma.onlineOrder.update.mockResolvedValue({
      id: 501,
      store_id: 10,
      claimedByRiderId: null,
      claimedByRiderName: null,
      riderAssigned: false,
      status: 'READY',
    });

    const res = await service.adminForceReleaseRiderAssignment(501, { sub: ADMIN_STORE_10.id, active_store_id: 10 });

    expect(res.success).toBe(true);
    expect(res.orderId).toBe(501);
    expect(res.orderType).toBe('ONLINE');
    expect(res.previousStatus).toBe('OUT_FOR_DELIVERY');
    expect(res.releasedRiderId).toBe(101);
    expect(prisma.onlineOrder.update).toHaveBeenCalledWith({
      where: { id: 501 },
      data: {
        claimedByRiderId: null,
        claimedByRiderName: null,
        riderAssigned: false,
        status: 'READY',
      },
    });
  });

  // 2. Authorized admin can force-release own-store POS delivery Order.
  it('2. Authorized admin can force-release own-store POS delivery Order', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(createMockPosOrder({ id: 601, store_id: 10, rider_id: 101 }));
    prisma.order.update.mockResolvedValue({ id: 601, store_id: 10, rider_id: null, status: 'READY' });
    prisma.order.findUniqueOrThrow.mockResolvedValue(createMockPosOrder({ id: 601, store_id: 10, rider_id: null, status: 'READY' }));

    const res = await service.adminForceReleaseRiderAssignment(601, { sub: ADMIN_STORE_10.id, active_store_id: 10 });

    expect(res.success).toBe(true);
    expect(res.orderId).toBe(601);
    expect(res.orderType).toBe('POS');
    expect(res.previousStatus).toBe('OUT_FOR_DELIVERY');
    expect(res.releasedRiderId).toBe(101);
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 601 },
      data: {
        rider_id: null,
        status: 'READY',
      },
    });
  });

  // 3. Unauthorized role cannot force-release.
  it('3. Unauthorized role (Rider) cannot force-release', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_CALLER);

    await expect(
      service.adminForceReleaseRiderAssignment(501, { sub: RIDER_CALLER.id, active_store_id: 10 }),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 4. Admin from wrong store cannot force-release another store's order.
  it('4. Admin from wrong store cannot force-release another store\'s order', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_20); // store 20

    // OnlineOrder belonging to store 10
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 502,
      store_id: 10,
      claimedByRiderId: 101,
      status: 'OUT_FOR_DELIVERY',
    });

    await expect(
      service.adminForceReleaseRiderAssignment(502, { sub: ADMIN_STORE_20.id, active_store_id: 20 }),
    ).rejects.toThrow(ForbiddenException);

    // POS Order belonging to store 10
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(createMockPosOrder({ id: 602, store_id: 10, rider_id: 101 }));

    await expect(
      service.adminForceReleaseRiderAssignment(602, { sub: ADMIN_STORE_20.id, active_store_id: 20 }),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 5. Missing/invalid authentication is rejected.
  it('5. Missing/invalid authentication is rejected', async () => {
    await expect(service.adminForceReleaseRiderAssignment(501, null)).rejects.toThrow(BadRequestException);
    await expect(service.adminForceReleaseRiderAssignment(501, {})).rejects.toThrow(BadRequestException);
    await expect(service.adminForceReleaseRiderAssignment(501, { sub: -1 })).rejects.toThrow(BadRequestException);
    await expect(service.adminForceReleaseRiderAssignment(501, { sub: 'invalid' })).rejects.toThrow(BadRequestException);

    // Non-existent user
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.adminForceReleaseRiderAssignment(501, { sub: 99999 })).rejects.toThrow(
      'Admin user does not exist.',
    );
  });

  // 6. No rider assignment -> safe rejection.
  it('6. No rider assignment -> safe rejection', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);

    // OnlineOrder with no claimed rider
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 503,
      store_id: 10,
      claimedByRiderId: null,
      status: 'READY',
    });

    await expect(
      service.adminForceReleaseRiderAssignment(503, { sub: ADMIN_STORE_10.id, active_store_id: 10 }),
    ).rejects.toThrow('Order #503 does not have an assigned rider.');

    // POS Order with no assigned rider
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(createMockPosOrder({ id: 603, store_id: 10, rider_id: null }));

    await expect(
      service.adminForceReleaseRiderAssignment(603, { sub: ADMIN_STORE_10.id, active_store_id: 10 }),
    ).rejects.toThrow('POS Order #603 does not have an assigned rider.');

    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 7. DELIVERED is rejected.
  it('7. DELIVERED is rejected', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 504,
      store_id: 10,
      claimedByRiderId: 101,
      status: 'DELIVERED',
    });

    await expect(
      service.adminForceReleaseRiderAssignment(504, { sub: ADMIN_STORE_10.id, active_store_id: 10 }),
    ).rejects.toThrow('Cannot force-release Order #504: cash hand-off has started (status: DELIVERED)');
  });

  // 8. WAITING_CASH_SETTLEMENT is rejected.
  it('8. WAITING_CASH_SETTLEMENT is rejected', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 505,
      store_id: 10,
      claimedByRiderId: 101,
      status: 'WAITING_CASH_SETTLEMENT',
    });

    await expect(
      service.adminForceReleaseRiderAssignment(505, { sub: ADMIN_STORE_10.id, active_store_id: 10 }),
    ).rejects.toThrow('Cannot force-release Order #505: cash hand-off has started (status: WAITING_CASH_SETTLEMENT)');
  });

  // 9. SETTLED is rejected.
  it('9. SETTLED is rejected', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 506,
      store_id: 10,
      claimedByRiderId: 101,
      status: 'SETTLED',
    });

    await expect(
      service.adminForceReleaseRiderAssignment(506, { sub: ADMIN_STORE_10.id, active_store_id: 10 }),
    ).rejects.toThrow('Cannot force-release Order #506: cash hand-off has started (status: SETTLED)');
  });

  // 10. CANCELLED is rejected.
  it('10. CANCELLED is rejected', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 507,
      store_id: 10,
      claimedByRiderId: 101,
      status: 'CANCELLED',
    });

    await expect(
      service.adminForceReleaseRiderAssignment(507, { sub: ADMIN_STORE_10.id, active_store_id: 10 }),
    ).rejects.toThrow('Cannot force-release Order #507: this order is in a terminal state (status: CANCELLED)');
  });

  // 11. VOIDED is rejected.
  it('11. VOIDED is rejected', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 508,
      store_id: 10,
      claimedByRiderId: 101,
      status: 'VOIDED',
    });

    await expect(
      service.adminForceReleaseRiderAssignment(508, { sub: ADMIN_STORE_10.id, active_store_id: 10 }),
    ).rejects.toThrow('Cannot force-release Order #508: this order is in a terminal state (status: VOIDED)');
  });

  // 12. COMPLETED is rejected.
  it('12. COMPLETED is rejected', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 509,
      store_id: 10,
      claimedByRiderId: 101,
      status: 'COMPLETED',
    });

    await expect(
      service.adminForceReleaseRiderAssignment(509, { sub: ADMIN_STORE_10.id, active_store_id: 10 }),
    ).rejects.toThrow('Cannot force-release Order #509: this order is in a terminal state (status: COMPLETED)');
  });

  // 13. Rejected force-release does not change order status.
  it('13. Rejected force-release does not change order status', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    for (const term of ['DELIVERED', 'WAITING_CASH_SETTLEMENT', 'SETTLED', 'CANCELLED', 'VOIDED', 'COMPLETED']) {
      prisma.onlineOrder.findUnique.mockResolvedValueOnce({
        id: 510,
        store_id: 10,
        claimedByRiderId: 101,
        status: term,
      });

      await expect(
        service.adminForceReleaseRiderAssignment(510, { sub: ADMIN_STORE_10.id, active_store_id: 10 }),
      ).rejects.toThrow(BadRequestException);
    }
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 14. Rejected force-release does not clear rider assignment.
  it('14. Rejected force-release does not clear rider assignment', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 511,
      store_id: 10,
      claimedByRiderId: 101,
      status: 'DELIVERED',
    });

    await expect(
      service.adminForceReleaseRiderAssignment(511, { sub: ADMIN_STORE_10.id, active_store_id: 10 }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
  });

  // 15. Successful force-release clears OnlineOrder claim.
  it('15. Successful force-release clears OnlineOrder claim', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 512,
      store_id: 10,
      claimedByRiderId: 101,
      claimedByRiderName: 'Rider Tariq',
      status: 'OUT_FOR_DELIVERY',
    });
    prisma.onlineOrder.update.mockResolvedValue({ id: 512, store_id: 10, claimedByRiderId: null, status: 'READY' });

    await service.adminForceReleaseRiderAssignment(512, { sub: ADMIN_STORE_10.id, active_store_id: 10 });

    expect(prisma.onlineOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 512 },
        data: expect.objectContaining({
          claimedByRiderId: null,
          claimedByRiderName: null,
          riderAssigned: false,
          status: 'READY',
        }),
      }),
    );
  });

  // 16. Successful force-release clears POS Order rider_id.
  it('16. Successful force-release clears POS Order rider_id', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(createMockPosOrder({ id: 613, store_id: 10, rider_id: 101 }));
    prisma.order.update.mockResolvedValue({ id: 613, store_id: 10, rider_id: null, status: 'READY' });
    prisma.order.findUniqueOrThrow.mockResolvedValue(createMockPosOrder({ id: 613, store_id: 10, rider_id: null, status: 'READY' }));

    await service.adminForceReleaseRiderAssignment(613, { sub: ADMIN_STORE_10.id, active_store_id: 10 });

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 613 },
        data: expect.objectContaining({
          rider_id: null,
          status: 'READY',
        }),
      }),
    );
  });

  // 17. Store/business-day/order identity remains intact.
  it('17. Store/business-day/order identity remains intact', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(createMockPosOrder({ id: 614, store_id: 10, business_day_id: 42, rider_id: 101 }));
    prisma.order.update.mockResolvedValue({ id: 614, store_id: 10, rider_id: null, status: 'READY' });
    prisma.order.findUniqueOrThrow.mockResolvedValue(createMockPosOrder({ id: 614, store_id: 10, business_day_id: 42, rider_id: null, status: 'READY' }));

    await service.adminForceReleaseRiderAssignment(614, { sub: ADMIN_STORE_10.id, active_store_id: 10 });

    const posUpdateData = prisma.order.update.mock.calls[0][0].data;
    expect(posUpdateData).not.toHaveProperty('store_id');
    expect(posUpdateData).not.toHaveProperty('business_day_id');
  });

  // 18. OnlineOrder <-> POS Order bridge remains intact.
  it('18. OnlineOrder <-> POS Order bridge remains intact', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 515,
      store_id: 10,
      claimedByRiderId: 101,
      posOrderId: 900,
      status: 'OUT_FOR_DELIVERY',
    });
    prisma.onlineOrder.update.mockResolvedValue({ id: 515, store_id: 10, claimedByRiderId: null, status: 'READY' });

    await service.adminForceReleaseRiderAssignment(515, { sub: ADMIN_STORE_10.id, active_store_id: 10 });

    // Both OnlineOrder and linked POS order assignments are updated
    expect(prisma.onlineOrder.update).toHaveBeenCalled();
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: 900 },
      data: { rider_id: null, status: 'READY' },
    });
  });

  // 19. Successful release broadcasts correct store room.
  it('19. Successful release broadcasts correct store room', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN_STORE_10);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 516,
      store_id: 10,
      claimedByRiderId: 101,
      status: 'OUT_FOR_DELIVERY',
    });
    const updated = { id: 516, store_id: 10, claimedByRiderId: null, status: 'READY' };
    prisma.onlineOrder.update.mockResolvedValue(updated);

    await service.adminForceReleaseRiderAssignment(516, { sub: ADMIN_STORE_10.id, active_store_id: 10 });

    expect(gateway.broadcast).toHaveBeenCalledWith(
      'order_updated',
      updated,
      'store_10',
    );
  });

  // 20. Released order becomes claimable by another rider.
  it('20. Released order becomes claimable by another rider', async () => {
    prisma.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === ADMIN_STORE_10.id) return ADMIN_STORE_10;
      if (where.id === 102) return { id: 102, name: 'Rider Sajid', store_id: 10, role: { name: 'Rider' } };
      return null;
    });

    let currentOrderState: any = {
      id: 517,
      store_id: 10,
      type: 'DELIVERY',
      claimedByRiderId: 101,
      claimedByRiderName: 'Rider Tariq',
      status: 'OUT_FOR_DELIVERY',
    };

    prisma.onlineOrder.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === 517) return { ...currentOrderState };
      return null;
    });

    prisma.onlineOrder.update.mockImplementation(async ({ data }: any) => {
      currentOrderState = { ...currentOrderState, ...data };
      return currentOrderState;
    });

    // Admin force-releases order 517
    const forceRes = await service.adminForceReleaseRiderAssignment(517, { sub: ADMIN_STORE_10.id, active_store_id: 10 });
    expect(forceRes.success).toBe(true);
    expect(currentOrderState.claimedByRiderId).toBeNull();
    expect(currentOrderState.status).toBe('READY');

    // New rider (102) claims the order
    prisma.onlineOrder.updateMany.mockImplementation(async ({ where, data }: any) => {
      if (where.id === 517 && currentOrderState.claimedByRiderId === null && currentOrderState.status === 'READY') {
        currentOrderState = { ...currentOrderState, ...data };
        return { count: 1 };
      }
      return { count: 0 };
    });
    prisma.onlineOrder.findUniqueOrThrow.mockImplementation(async () => currentOrderState);

    const claimRes = await service.claimOrder(517, { sub: 102 });
    expect(claimRes.success).toBe(true);
    expect(currentOrderState.claimedByRiderId).toBe(102);
  });

  // 21. Concurrent claim/release remains consistent.
  it('21. Concurrent claim/release remains consistent: claim fails while order has assigned rider', async () => {
    prisma.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === ADMIN_STORE_10.id) return ADMIN_STORE_10;
      if (where.id === 102) return { id: 102, name: 'Rider Sajid', store_id: 10, role: { name: 'Rider' } };
      return null;
    });

    // Order currently assigned to Rider 101
    const orderState = {
      id: 518,
      store_id: 10,
      type: 'DELIVERY',
      claimedByRiderId: 101,
      status: 'OUT_FOR_DELIVERY',
    };
    prisma.onlineOrder.findUnique.mockResolvedValue({ ...orderState });

    // Attempting claim on an order that has not been released yet fails
    prisma.onlineOrder.updateMany.mockResolvedValue({ count: 0 }); // matches 0 because claimedByRiderId IS NOT NULL

    await expect(service.claimOrder(518, { sub: 102 })).rejects.toThrow(BadRequestException);
  });
});
