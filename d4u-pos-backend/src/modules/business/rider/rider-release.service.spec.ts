import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RiderService } from './rider.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';

describe('RiderService — releaseRiderAssignment (Sprint 29.1 Delivery Recovery)', () => {
  let service: RiderService;
  let prisma: any;
  let gateway: any;

  const RIDER_A = { id: 101, name: 'Tariq Rider', store_id: 10, role: { name: 'Rider' } };
  const RIDER_B = { id: 102, name: 'Sajid Rider', store_id: 10, role: { name: 'Rider' } };
  const RIDER_DIFF_STORE = { id: 103, name: 'Hamza Rider', store_id: 20, role: { name: 'Rider' } };
  const NON_RIDER = { id: 104, name: 'Manager Bob', store_id: 10, role: { name: 'Manager' } };

  const createMockPosOrder = (overrides: any = {}) => ({
    id: 601,
    store_id: 10,
    rider_id: null,
    status: 'READY',
    business_day_id: 5,
    items: [],
    customer: null,
    rider: null,
    total_amount: 100,
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

  // 1. OnlineOrder release by owning rider succeeds.
  it('1. OnlineOrder release by owning rider succeeds', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 501,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      claimedByRiderName: RIDER_A.name,
      status: 'OUT_FOR_DELIVERY',
    });
    prisma.onlineOrder.update.mockResolvedValue({
      id: 501,
      store_id: 10,
      claimedByRiderId: null,
      claimedByRiderName: null,
      status: 'READY',
    });

    const res = await service.releaseRiderAssignment(501, { sub: RIDER_A.id });

    expect(res.success).toBe(true);
    expect(res.orderId).toBe(501);
    expect(res.orderType).toBe('ONLINE');
    expect(res.previousStatus).toBe('OUT_FOR_DELIVERY');
    expect(prisma.onlineOrder.update).toHaveBeenCalledWith({
      where: { id: 501 },
      data: {
        claimedByRiderId: null,
        claimedByRiderName: null,
        status: 'READY',
      },
    });
  });

  // 2. POS Order release by owning rider succeeds.
  it('2. POS Order release by owning rider succeeds', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      id: 601,
      store_id: 10,
      rider_id: RIDER_A.id,
      status: 'OUT_FOR_DELIVERY',
      business_day_id: 5,
    });
    prisma.order.update.mockResolvedValue({
      id: 601,
      store_id: 10,
      rider_id: null,
      status: 'READY',
    });
    prisma.order.findUniqueOrThrow.mockResolvedValue(
      createMockPosOrder({
        id: 601,
        store_id: 10,
        rider_id: null,
        status: 'READY',
        business_day_id: 5,
      }),
    );

    const res = await service.releaseRiderAssignment(601, { sub: RIDER_A.id });

    expect(res.success).toBe(true);
    expect(res.orderId).toBe(601);
    expect(res.orderType).toBe('POS');
    expect(res.previousStatus).toBe('OUT_FOR_DELIVERY');
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 601 },
      data: {
        rider_id: null,
        status: 'READY',
      },
    });
  });

  // 3. Missing/invalid JWT rider identity rejected.
  it('3. Missing/invalid JWT rider identity rejected', async () => {
    await expect(service.releaseRiderAssignment(501, null)).rejects.toThrow(BadRequestException);
    await expect(service.releaseRiderAssignment(501, {})).rejects.toThrow(BadRequestException);
    await expect(service.releaseRiderAssignment(501, { sub: null })).rejects.toThrow(BadRequestException);
    await expect(service.releaseRiderAssignment(501, { sub: -5 })).rejects.toThrow(BadRequestException);
    await expect(service.releaseRiderAssignment(501, { sub: 'invalid_id' })).rejects.toThrow(BadRequestException);

    // Non-existent rider in DB
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.releaseRiderAssignment(501, { sub: 9999 })).rejects.toThrow(
      'Rider does not exist.',
    );

    // Non-rider role in DB
    prisma.user.findUnique.mockResolvedValue(NON_RIDER);
    await expect(service.releaseRiderAssignment(501, { sub: NON_RIDER.id })).rejects.toThrow(
      'Authenticated user is not a rider.',
    );

    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 4. Wrong rider cannot release another rider's order.
  it('4. Wrong rider cannot release another rider\'s order (OnlineOrder & POS)', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_B);
    // OnlineOrder assigned to RIDER_A
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 502,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'OUT_FOR_DELIVERY',
    });

    await expect(service.releaseRiderAssignment(502, { sub: RIDER_B.id })).rejects.toThrow(
      'Cannot release Order #502: it is not assigned to you.',
    );

    // POS Order assigned to RIDER_A
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      id: 602,
      store_id: 10,
      rider_id: RIDER_A.id,
      status: 'OUT_FOR_DELIVERY',
    });

    await expect(service.releaseRiderAssignment(602, { sub: RIDER_B.id })).rejects.toThrow(
      'Cannot release POS Order #602: it is not assigned to you.',
    );

    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 5. Matching rider but WRONG STORE cannot release the order.
  it('5. Matching rider but WRONG STORE cannot release the order (High Blocker #1)', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_DIFF_STORE); // store 20

    // Online order assigned to RIDER_DIFF_STORE but belongs to store 10
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 503,
      store_id: 10,
      claimedByRiderId: RIDER_DIFF_STORE.id,
      status: 'OUT_FOR_DELIVERY',
    });

    await expect(service.releaseRiderAssignment(503, { sub: RIDER_DIFF_STORE.id })).rejects.toThrow(
      'Rider store mismatch.',
    );

    // POS order assigned to RIDER_DIFF_STORE but belongs to store 10
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      id: 603,
      store_id: 10,
      rider_id: RIDER_DIFF_STORE.id,
      status: 'OUT_FOR_DELIVERY',
    });

    await expect(service.releaseRiderAssignment(603, { sub: RIDER_DIFF_STORE.id })).rejects.toThrow(
      'Rider store mismatch.',
    );

    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 6. READY can be released if policy allows it.
  it('6. READY status order can be released (clears claim and remains READY)', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 504,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'READY',
    });
    prisma.onlineOrder.update.mockResolvedValue({
      id: 504,
      store_id: 10,
      claimedByRiderId: null,
      claimedByRiderName: null,
      status: 'READY',
    });

    const res = await service.releaseRiderAssignment(504, { sub: RIDER_A.id });
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('READY');
    expect(prisma.onlineOrder.update).toHaveBeenCalledWith({
      where: { id: 504 },
      data: { claimedByRiderId: null, claimedByRiderName: null, status: 'READY' },
    });
  });

  // 7. RIDER_ACCEPTED behavior verified.
  it('7. RIDER_ACCEPTED order can be released back to READY', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 505,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'RIDER_ACCEPTED',
    });
    prisma.onlineOrder.update.mockResolvedValue({
      id: 505,
      store_id: 10,
      claimedByRiderId: null,
      status: 'READY',
    });

    const res = await service.releaseRiderAssignment(505, { sub: RIDER_A.id });
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('RIDER_ACCEPTED');
  });

  // 8. RIDER_ARRIVED behavior verified.
  it('8. RIDER_ARRIVED order can be released back to READY', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 506,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'RIDER_ARRIVED',
    });
    prisma.onlineOrder.update.mockResolvedValue({
      id: 506,
      store_id: 10,
      claimedByRiderId: null,
      status: 'READY',
    });

    const res = await service.releaseRiderAssignment(506, { sub: RIDER_A.id });
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('RIDER_ARRIVED');
  });

  // 9. PRINT_BILL behavior verified.
  it('9. PRINT_BILL order can be released back to READY', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 507,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'PRINT_BILL',
    });
    prisma.onlineOrder.update.mockResolvedValue({
      id: 507,
      store_id: 10,
      claimedByRiderId: null,
      status: 'READY',
    });

    const res = await service.releaseRiderAssignment(507, { sub: RIDER_A.id });
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('PRINT_BILL');
  });

  // 10. DISPATCHED behavior verified.
  it('10. DISPATCHED order can be released back to READY', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 508,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'DISPATCHED',
    });
    prisma.onlineOrder.update.mockResolvedValue({
      id: 508,
      store_id: 10,
      claimedByRiderId: null,
      status: 'READY',
    });

    const res = await service.releaseRiderAssignment(508, { sub: RIDER_A.id });
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('DISPATCHED');
  });

  // 11. OUT_FOR_DELIVERY behavior verified according to the audited lifecycle policy.
  it('11. OUT_FOR_DELIVERY order can be released back to READY (pre-hand-off recovery)', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 509,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'OUT_FOR_DELIVERY',
    });
    prisma.onlineOrder.update.mockResolvedValue({
      id: 509,
      store_id: 10,
      claimedByRiderId: null,
      status: 'READY',
    });

    const res = await service.releaseRiderAssignment(509, { sub: RIDER_A.id });
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('OUT_FOR_DELIVERY');
  });

  // 12. DELIVERED rejected.
  it('12. DELIVERED rejected with cash hand-off notice', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 510,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'DELIVERED',
    });

    await expect(service.releaseRiderAssignment(510, { sub: RIDER_A.id })).rejects.toThrow(
      'Cannot release Order #510: cash hand-off has started (status: DELIVERED)',
    );
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
  });

  // 13. WAITING_CASH_SETTLEMENT rejected.
  it('13. WAITING_CASH_SETTLEMENT rejected with cash hand-off notice', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 511,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'WAITING_CASH_SETTLEMENT',
    });

    await expect(service.releaseRiderAssignment(511, { sub: RIDER_A.id })).rejects.toThrow(
      'Cannot release Order #511: cash hand-off has started (status: WAITING_CASH_SETTLEMENT)',
    );
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
  });

  // 14. SETTLED rejected.
  it('14. SETTLED rejected with cash hand-off notice', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 512,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'SETTLED',
    });

    await expect(service.releaseRiderAssignment(512, { sub: RIDER_A.id })).rejects.toThrow(
      'Cannot release Order #512: cash hand-off has started (status: SETTLED)',
    );
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
  });

  // 15. CANCELLED rejected.
  it('15. CANCELLED rejected with terminal state error', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 513,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'CANCELLED',
    });

    await expect(service.releaseRiderAssignment(513, { sub: RIDER_A.id })).rejects.toThrow(
      'Cannot release Order #513: this order is in a terminal state (status: CANCELLED)',
    );
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
  });

  // 16. VOIDED rejected (High Blocker #2).
  it('16. VOIDED rejected with terminal state error (High Blocker #2)', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    // OnlineOrder VOIDED
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 514,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'VOIDED',
    });

    await expect(service.releaseRiderAssignment(514, { sub: RIDER_A.id })).rejects.toThrow(
      'Cannot release Order #514: this order is in a terminal state (status: VOIDED)',
    );

    // POS Order VOIDED
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      id: 614,
      store_id: 10,
      rider_id: RIDER_A.id,
      status: 'VOIDED',
    });

    await expect(service.releaseRiderAssignment(614, { sub: RIDER_A.id })).rejects.toThrow(
      'Cannot release POS Order #614: this order is in a terminal state (status: VOIDED)',
    );

    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 17. COMPLETED rejected (High Blocker #2).
  it('17. COMPLETED rejected with terminal state error (High Blocker #2)', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    // OnlineOrder COMPLETED
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 515,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'COMPLETED',
    });

    await expect(service.releaseRiderAssignment(515, { sub: RIDER_A.id })).rejects.toThrow(
      'Cannot release Order #515: this order is in a terminal state (status: COMPLETED)',
    );

    // POS Order COMPLETED
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      id: 615,
      store_id: 10,
      rider_id: RIDER_A.id,
      status: 'COMPLETED',
    });

    await expect(service.releaseRiderAssignment(615, { sub: RIDER_A.id })).rejects.toThrow(
      'Cannot release POS Order #615: this order is in a terminal state (status: COMPLETED)',
    );

    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 18. Rejected terminal release does not change status.
  it('18. Rejected terminal release does not change status in DB', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    for (const termStatus of ['DELIVERED', 'WAITING_CASH_SETTLEMENT', 'SETTLED', 'CANCELLED', 'VOIDED', 'COMPLETED']) {
      prisma.onlineOrder.findUnique.mockResolvedValueOnce({
        id: 516,
        store_id: 10,
        claimedByRiderId: RIDER_A.id,
        status: termStatus,
      });

      await expect(service.releaseRiderAssignment(516, { sub: RIDER_A.id })).rejects.toThrow(
        BadRequestException,
      );
    }
    // Zero update calls executed across all terminal rejection attempts
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 19. Rejected terminal release does not clear rider assignment.
  it('19. Rejected terminal release does not clear rider assignment', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 517,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'VOIDED',
    });

    await expect(service.releaseRiderAssignment(517, { sub: RIDER_A.id })).rejects.toThrow(
      BadRequestException,
    );

    // Verify neither claimedByRiderId nor rider_id was cleared in the DB
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 20. Successful release clears the rider assignment.
  it('20. Successful release clears the rider assignment (claimedByRiderId / rider_id = null)', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    // Test OnlineOrder
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 518,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'RIDER_ACCEPTED',
    });
    prisma.onlineOrder.update.mockResolvedValue({ id: 518, store_id: 10, claimedByRiderId: null, status: 'READY' });

    await service.releaseRiderAssignment(518, { sub: RIDER_A.id });
    expect(prisma.onlineOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          claimedByRiderId: null,
          claimedByRiderName: null,
          status: 'READY',
        }),
      }),
    );

    // Test POS Order
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      id: 618,
      store_id: 10,
      rider_id: RIDER_A.id,
      status: 'RIDER_ACCEPTED',
    });
    prisma.order.update.mockResolvedValue({ id: 618, store_id: 10, rider_id: null, status: 'READY' });
    prisma.order.findUniqueOrThrow.mockResolvedValue(
      createMockPosOrder({
        id: 618,
        store_id: 10,
        rider_id: null,
        status: 'READY',
      }),
    );

    await service.releaseRiderAssignment(618, { sub: RIDER_A.id });
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rider_id: null,
          status: 'READY',
        }),
      }),
    );
  });

  // 21. Successful release leaves store_id unchanged.
  it('21. Successful release leaves store_id unchanged', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 519,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'DISPATCHED',
    });
    prisma.onlineOrder.update.mockResolvedValue({ id: 519, store_id: 10, claimedByRiderId: null, status: 'READY' });

    await service.releaseRiderAssignment(519, { sub: RIDER_A.id });

    const updatePayload = prisma.onlineOrder.update.mock.calls[0][0].data;
    expect(updatePayload).not.toHaveProperty('store_id');
  });

  // 22. Successful release leaves business_day_id unchanged for POS Order.
  it('22. Successful release leaves business_day_id unchanged for POS Order', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      id: 620,
      store_id: 10,
      rider_id: RIDER_A.id,
      status: 'DISPATCHED',
      business_day_id: 42,
    });
    prisma.order.update.mockResolvedValue({ id: 620, store_id: 10, rider_id: null, status: 'READY' });
    prisma.order.findUniqueOrThrow.mockResolvedValue(
      createMockPosOrder({
        id: 620,
        store_id: 10,
        rider_id: null,
        status: 'READY',
        business_day_id: 42,
      }),
    );

    await service.releaseRiderAssignment(620, { sub: RIDER_A.id });

    const posUpdatePayload = prisma.order.update.mock.calls[0][0].data;
    expect(posUpdatePayload).not.toHaveProperty('business_day_id');
  });

  // 23. Successful release does not break OnlineOrder <-> POS Order bridge.
  it('23. Successful release does not break OnlineOrder <-> POS Order bridge', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    // An OnlineOrder that exists in the database
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 521,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'OUT_FOR_DELIVERY',
      pos_order_id: 999, // bridged to POS order 999
    });
    prisma.onlineOrder.update.mockResolvedValue({
      id: 521,
      store_id: 10,
      claimedByRiderId: null,
      status: 'READY',
      pos_order_id: 999,
    });

    await service.releaseRiderAssignment(521, { sub: RIDER_A.id });

    const updateData = prisma.onlineOrder.update.mock.calls[0][0].data;
    // Bridged pos_order_id is preserved and not cleared
    expect(updateData).not.toHaveProperty('pos_order_id');
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  // 24. Successful release broadcasts the correct store-scoped update.
  it('24. Successful release broadcasts the correct store-scoped update', async () => {
    prisma.user.findUnique.mockResolvedValue(RIDER_A);
    // OnlineOrder broadcast check
    prisma.onlineOrder.findUnique.mockResolvedValue({
      id: 522,
      store_id: 10,
      claimedByRiderId: RIDER_A.id,
      status: 'OUT_FOR_DELIVERY',
    });
    const updatedOnline = { id: 522, store_id: 10, claimedByRiderId: null, status: 'READY' };
    prisma.onlineOrder.update.mockResolvedValue(updatedOnline);

    await service.releaseRiderAssignment(522, { sub: RIDER_A.id });

    expect(gateway.broadcast).toHaveBeenCalledWith(
      'order_updated',
      updatedOnline,
      'store_10',
    );

    // POS Order broadcast check
    prisma.onlineOrder.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      id: 622,
      store_id: 10,
      rider_id: RIDER_A.id,
      status: 'OUT_FOR_DELIVERY',
    });
    prisma.order.update.mockResolvedValue({ id: 622, store_id: 10, rider_id: null, status: 'READY' });
    prisma.order.findUniqueOrThrow.mockResolvedValue(
      createMockPosOrder({
        id: 622,
        store_id: 10,
        rider_id: null,
        status: 'READY',
      }),
    );

    await service.releaseRiderAssignment(622, { sub: RIDER_A.id });

    expect(gateway.broadcast).toHaveBeenCalledWith(
      'order_updated',
      expect.objectContaining({ id: 622 }),
      'store_10',
    );
  });

  // 25. Released order becomes claimable by another eligible rider.
  it('25. Released order becomes claimable by another eligible rider', async () => {
    // Phase 1: Rider A releases order 523
    prisma.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === RIDER_A.id) return RIDER_A;
      if (where.id === RIDER_B.id) return RIDER_B;
      return null;
    });

    let currentOrderState: any = {
      id: 523,
      store_id: 10,
      type: 'DELIVERY',
      claimedByRiderId: RIDER_A.id,
      claimedByRiderName: RIDER_A.name,
      status: 'OUT_FOR_DELIVERY',
    };

    prisma.onlineOrder.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === 523) return { ...currentOrderState };
      return null;
    });

    prisma.onlineOrder.update.mockImplementation(async ({ data }: any) => {
      currentOrderState = {
        ...currentOrderState,
        ...data,
      };
      return currentOrderState;
    });

    // Release by Rider A
    const releaseRes = await service.releaseRiderAssignment(523, { sub: RIDER_A.id });
    expect(releaseRes.success).toBe(true);
    expect(currentOrderState.claimedByRiderId).toBeNull();
    expect(currentOrderState.status).toBe('READY');

    // Phase 2: Rider B claims the released order
    prisma.onlineOrder.updateMany.mockImplementation(async ({ where, data }: any) => {
      if (where.id === 523 && currentOrderState.claimedByRiderId === null && currentOrderState.status === 'READY') {
        currentOrderState = { ...currentOrderState, ...data };
        return { count: 1 };
      }
      return { count: 0 };
    });

    prisma.onlineOrder.findUniqueOrThrow.mockImplementation(async () => currentOrderState);

    const claimRes = await service.claimOrder(523, { sub: RIDER_B.id });
    expect(claimRes.success).toBe(true);
    expect(currentOrderState.claimedByRiderId).toBe(RIDER_B.id);
    expect(currentOrderState.claimedByRiderName).toBe(RIDER_B.name);
  });
});
