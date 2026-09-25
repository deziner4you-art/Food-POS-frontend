import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OnlineOrdersService } from './online-orders.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { PricingService } from '../pos-orders/pricing.service';
import { CustomersService } from '../customers/customers.service';

// Task #2Q-B3: PATCH /online-orders/:id now enforces that a caller whose
// real, DB-resolved role is Rider may only progress a delivery they've
// actually claimed (OnlineOrder.claimedByRiderId === authenticatedUser.sub).
// Staff callers (any other role) are completely unaffected -- the existing
// store-tenant check is the only gate that applies to them, unchanged.
describe('OnlineOrdersService.updateOrderStatus — Rider ownership (Task #2Q-B3)', () => {
  let service: OnlineOrdersService;
  let prisma: any;
  let gateway: { broadcast: jest.Mock };

  const STORE_ID = 67;
  const RIDER_A = 90;
  const RIDER_B = 91;

  const orderClaimedByRiderA = {
    id: 500,
    store_id: STORE_ID,
    status: 'OUT_FOR_DELIVERY',
    claimedByRiderId: RIDER_A,
    order_source: 'DELIVERY',
  };
  const unclaimedOrder = { ...orderClaimedByRiderA, id: 501, claimedByRiderId: null };

  beforeEach(async () => {
    prisma = {
      onlineOrder: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      order: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
      user: { findUnique: jest.fn() },
      orderEventLog: { create: jest.fn() },
      businessDay: { findFirst: jest.fn(), update: jest.fn() },
      product: { findFirst: jest.fn() },
      inventoryItem: { update: jest.fn() },
      inventoryTransactionLog: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    gateway = { broadcast: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineOrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
        { provide: PricingService, useValue: {} },
        { provide: CustomersService, useValue: {} },
      ],
    }).compile();

    service = module.get<OnlineOrdersService>(OnlineOrdersService);
  });

  it('1. Rider updates their OWN claimed order -> ALLOWED', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue(orderClaimedByRiderA);
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'Rider' } });
    prisma.onlineOrder.update.mockResolvedValue({ ...orderClaimedByRiderA, notes: 'arrived' });

    const result = await service.updateOrderStatus(500, { notes: 'arrived' }, { sub: RIDER_A, store_id: STORE_ID });

    expect(result.success).toBe(true);
    expect(prisma.onlineOrder.update).toHaveBeenCalled();
  });

  it('2. Rider updates ANOTHER rider\'s claimed order -> DENIED', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue(orderClaimedByRiderA); // claimed by Rider A
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'Rider' } });

    await expect(
      service.updateOrderStatus(500, { notes: 'arrived' }, { sub: RIDER_B, store_id: STORE_ID }), // Rider B calling
    ).rejects.toThrow(NotFoundException);
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
  });

  it('3. Rider updates an UNCLAIMED order -> DENIED (must claim first)', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue(unclaimedOrder);
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'Rider' } });

    await expect(
      service.updateOrderStatus(501, { notes: 'arrived' }, { sub: RIDER_A, store_id: STORE_ID }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
  });

  it('7. Staff (non-Rider role) is completely unaffected -- can update any order in their store regardless of claimedByRiderId', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue(orderClaimedByRiderA); // claimed by a rider, not this cashier
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'Cashier' } });
    prisma.onlineOrder.update.mockResolvedValue({ ...orderClaimedByRiderA, notes: 'staff edit' });

    const CASHIER_SUB = 5;
    const result = await service.updateOrderStatus(500, { notes: 'staff edit' }, { sub: CASHIER_SUB, store_id: STORE_ID });

    expect(result.success).toBe(true);
    expect(prisma.onlineOrder.update).toHaveBeenCalled();
  });

  it('8. Different-store behavior is unchanged -- the pre-existing tenant check still rejects a caller from another store, before ownership is even considered', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue(orderClaimedByRiderA); // store 67

    await expect(
      service.updateOrderStatus(500, { notes: 'x' }, { sub: 5, store_id: 999 }), // different store
    ).rejects.toThrow(NotFoundException);
    // The tenant check throws first -- the role lookup for ownership is never reached.
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
  });

  it('9. A spoofed body field cannot bypass ownership -- only authenticatedUser.sub (the verified JWT identity) is ever consulted', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue(orderClaimedByRiderA); // claimed by Rider A (90)
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'Rider' } });

    // Rider B is the REAL authenticated caller, but the request body claims
    // to be Rider A (the field isn't even in allowedKeys, so it can't reach
    // the database either way -- this proves the ownership decision never
    // looks at it in the first place).
    const spoofedBody = { notes: 'arrived', riderId: RIDER_A, claimedByRiderId: RIDER_A };

    await expect(
      service.updateOrderStatus(500, spoofedBody, { sub: RIDER_B, store_id: STORE_ID }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: RIDER_B },
      select: { role: { select: { name: true } } },
    });
  });
});

// Task #2Q-D1: getOrdersByPhone used to be unscoped by any tenant boundary
// -- any caller holding sales.view could retrieve any phone number's full
// order history across every store in the system. It's now constrained to
// the authenticated caller's own store (OnlineOrder's native tenant field).
describe('OnlineOrdersService.getOrdersByPhone — tenant isolation (Task #2Q-D1)', () => {
  let service: OnlineOrdersService;
  let prisma: any;

  const STORE_A = { id: 67 };
  const STORE_B = { id: 68 };
  const STAFF_A = { sub: 5, active_store_id: STORE_A.id }; // real staff shape
  const WAITER_B = { sub: 'terminal-session-9', role: 'Waiter', store_id: STORE_B.id }; // synthetic session shape

  beforeEach(async () => {
    prisma = {
      onlineOrder: { findMany: jest.fn() },
      store: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineOrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: { broadcast: jest.fn() } },
        { provide: PricingService, useValue: {} },
        { provide: CustomersService, useValue: {} },
      ],
    }).compile();

    service = module.get<OnlineOrdersService>(OnlineOrdersService);
  });

  it('1. same-store phone lookup -- the query is constrained to the caller\'s own store', async () => {
    prisma.store.findUnique.mockResolvedValue(STORE_A);
    prisma.onlineOrder.findMany.mockResolvedValue([{ id: 900, store_id: STORE_A.id }]);

    const result = await service.getOrdersByPhone('+923000000001', STAFF_A);

    expect(result).toEqual([{ id: 900, store_id: STORE_A.id }]);
    expect(prisma.onlineOrder.findMany).toHaveBeenCalledWith({
      where: { customerPhone: '923000000001', store_id: STORE_A.id },
      orderBy: { id: 'desc' },
    });
  });

  it("2. the same phone's orders at ANOTHER store are never returned -- the query is always keyed to the authenticated caller's own store", async () => {
    prisma.store.findUnique.mockResolvedValue(STORE_B);
    prisma.onlineOrder.findMany.mockResolvedValue([]);

    await service.getOrdersByPhone('+923000000001', WAITER_B); // caller is store B

    const calledWhere = prisma.onlineOrder.findMany.mock.calls[0][0].where;
    expect(calledWhere.store_id).toBe(STORE_B.id);
    expect(calledWhere.store_id).not.toBe(STORE_A.id);
  });

  it('3. missing/invalid authenticated store -> safely rejected, no order query attempted', async () => {
    await expect(service.getOrdersByPhone('+923000000001', undefined)).rejects.toThrow(BadRequestException);
    await expect(service.getOrdersByPhone('+923000000001', {})).rejects.toThrow(BadRequestException);
    expect(prisma.onlineOrder.findMany).not.toHaveBeenCalled();
  });

  it('4. authenticated store_id does not correspond to any real store -> rejected safely', async () => {
    prisma.store.findUnique.mockResolvedValue(null);
    await expect(service.getOrdersByPhone('+923000000001', STAFF_A)).rejects.toThrow(BadRequestException);
    expect(prisma.onlineOrder.findMany).not.toHaveBeenCalled();
  });

  it('5. normalizePhone() is still applied exactly as before', async () => {
    prisma.store.findUnique.mockResolvedValue(STORE_A);
    prisma.onlineOrder.findMany.mockResolvedValue([]);

    await service.getOrdersByPhone('+92 300-0000001', STAFF_A);

    expect(prisma.onlineOrder.findMany).toHaveBeenCalledWith({
      where: { customerPhone: '923000000001', store_id: STORE_A.id },
      orderBy: { id: 'desc' },
    });
  });

  it('6. the synthetic Waiter session shape (store_id, no brand claim at all) is resolved correctly via its store', async () => {
    prisma.store.findUnique.mockResolvedValue(STORE_B);
    prisma.onlineOrder.findMany.mockResolvedValue([]);

    await service.getOrdersByPhone('+923000000002', WAITER_B);

    expect(prisma.store.findUnique).toHaveBeenCalledWith({ where: { id: STORE_B.id } });
  });
});

describe('OnlineOrdersService.updateOrderStatus — State Machine Hardening (Findings #1 & #3)', () => {
  let service: OnlineOrdersService;
  let prisma: any;
  let gateway: { broadcast: jest.Mock };

  const STORE_ID = 1;
  const CASHIER = { sub: 10, store_id: STORE_ID };

  beforeEach(async () => {
    prisma = {
      onlineOrder: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      order: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
      user: { findUnique: jest.fn().mockResolvedValue({ role: { name: 'Cashier' } }) },
      orderEventLog: { create: jest.fn() },
      $transaction: jest.fn((cb) => cb(prisma)),
    };
    gateway = { broadcast: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineOrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
        { provide: PricingService, useValue: {} },
        { provide: CustomersService, useValue: {} },
      ],
    }).compile();

    service = module.get<OnlineOrdersService>(OnlineOrdersService);
  });

  it('1. Rejects invalid / unknown target state', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 101, store_id: STORE_ID, status: 'PENDING' });
    await expect(
      service.updateOrderStatus(101, { status: 'INVALID_FOO_BAR' }, CASHIER),
    ).rejects.toThrow(BadRequestException);
  });

  it('2. Rejects moving backwards from terminal state (SETTLED -> CONFIRMED)', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 102, store_id: STORE_ID, status: 'SETTLED' });
    await expect(
      service.updateOrderStatus(102, { status: 'CONFIRMED' }, CASHIER),
    ).rejects.toThrow(BadRequestException);
  });

  it('3. Rejects backwards transition in general (READY -> CONFIRMED)', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 103, store_id: STORE_ID, status: 'READY' });
    await expect(
      service.updateOrderStatus(103, { status: 'CONFIRMED' }, CASHIER),
    ).rejects.toThrow(BadRequestException);
  });

  it('4. Rejects pre-READY orders jumping directly into Delivery states (CONFIRMED -> DISPATCHED)', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 104, store_id: STORE_ID, status: 'CONFIRMED' });
    await expect(
      service.updateOrderStatus(104, { status: 'DISPATCHED' }, CASHIER),
    ).rejects.toThrow(BadRequestException);
  });

  it('5. Rejects skipping intermediate kitchen state (PENDING -> READY)', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 105, store_id: STORE_ID, status: 'PENDING' });
    await expect(
      service.updateOrderStatus(105, { status: 'READY' }, CASHIER),
    ).rejects.toThrow(BadRequestException);
  });

  it('6. Allows sequential transition: PENDING -> CONFIRMED', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 106, store_id: STORE_ID, status: 'PENDING', posOrderId: 10 });
    prisma.onlineOrder.update.mockResolvedValue({ id: 106, store_id: STORE_ID, status: 'CONFIRMED' });

    const result = await service.updateOrderStatus(106, { status: 'CONFIRMED' }, CASHIER);
    expect(result.success).toBe(true);
    expect(prisma.onlineOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CONFIRMED' }) }),
    );
  });

  it('7. KDS ACCEPTED normalization: when existing status is CONFIRMED, ACCEPTED becomes KITCHEN_PREPARING (Finding #3)', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 107, store_id: STORE_ID, status: 'CONFIRMED', posOrderId: 11 });
    prisma.onlineOrder.update.mockResolvedValue({ id: 107, store_id: STORE_ID, status: 'KITCHEN_PREPARING' });

    const result = await service.updateOrderStatus(107, { kdsStatus: 'ACCEPTED' }, CASHIER);
    expect(result.success).toBe(true);
    expect(prisma.onlineOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'KITCHEN_PREPARING', kdsStatus: 'KITCHEN_PREPARING' }) }),
    );
  });

  it('8. Cashier ACCEPTED normalization: when existing status is PENDING, ACCEPTED becomes CONFIRMED', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 108, store_id: STORE_ID, status: 'PENDING', posOrderId: 12 });
    prisma.onlineOrder.update.mockResolvedValue({ id: 108, store_id: STORE_ID, status: 'CONFIRMED' });

    const result = await service.updateOrderStatus(108, { status: 'ACCEPTED' }, CASHIER);
    expect(result.success).toBe(true);
    expect(prisma.onlineOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CONFIRMED' }) }),
    );
  });

  it('9. Rejects settlement directly from early states (CONFIRMED -> SETTLED)', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 109, store_id: STORE_ID, status: 'CONFIRMED' });
    await expect(
      service.updateOrderStatus(109, { status: 'SETTLED' }, CASHIER),
    ).rejects.toThrow(BadRequestException);
  });

  it('10. Allows direct settlement from DELIVERED -> SETTLED shortcut', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 110, store_id: STORE_ID, status: 'DELIVERED' });
    prisma.onlineOrder.update.mockResolvedValue({ id: 110, store_id: STORE_ID, status: 'SETTLED' });

    const result = await service.updateOrderStatus(110, { status: 'SETTLED' }, CASHIER);
    expect(result.success).toBe(true);
  });

  it('11. Rejects cancellation after delivery', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 111, store_id: STORE_ID, status: 'DELIVERED' });
    await expect(
      service.updateOrderStatus(111, { status: 'CANCELLED' }, CASHIER),
    ).rejects.toThrow(BadRequestException);
  });

  // --- FINDING #1: ONLINE DELIVERY TYPE ISOLATION ---
  describe('Finding #1 — Online Delivery Type Isolation', () => {
    it('DELIVERY + READY is eligible for active delivery query', async () => {
      prisma.onlineOrder.findMany = jest.fn().mockResolvedValue([{ id: 201, type: 'DELIVERY', status: 'READY' }]);
      const res = await service.getAllOnlineOrders(STORE_ID, true);
      expect(prisma.onlineOrder.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: { equals: 'DELIVERY', mode: 'insensitive' },
          status: expect.objectContaining({ in: expect.arrayContaining(['READY']) }),
        }),
        orderBy: { id: 'desc' },
      });
      expect(res).toHaveLength(1);
    });

    it('business_day_id isolates active delivery query via posOrder relation', async () => {
      prisma.onlineOrder.findMany = jest.fn().mockResolvedValue([{ id: 201, type: 'DELIVERY', status: 'READY' }]);
      const res = await service.getAllOnlineOrders(STORE_ID, true, 10);
      expect(prisma.onlineOrder.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: { equals: 'DELIVERY', mode: 'insensitive' },
          status: expect.objectContaining({ in: expect.arrayContaining(['READY']) }),
          store_id: STORE_ID,
          posOrder: { business_day_id: 10 },
        }),
        orderBy: { id: 'desc' },
      });
      expect(res).toHaveLength(1);
    });

    it('non-delivery order (PICKUP) attempting RIDER_ARRIVED is rejected', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 202,
        store_id: STORE_ID,
        status: 'READY',
        type: 'PICKUP',
      });
      await expect(
        service.updateOrderStatus(202, { status: 'RIDER_ARRIVED' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
    });

    it('non-delivery order (DINE_IN) attempting DISPATCHED is rejected', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 203,
        store_id: STORE_ID,
        status: 'READY',
        type: 'DINE_IN',
        claimedByRiderId: 90,
      });
      await expect(
        service.updateOrderStatus(203, { status: 'DISPATCHED' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
    });

    it('non-delivery order (PICKUP) attempting OUT_FOR_DELIVERY is rejected', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 204,
        store_id: STORE_ID,
        status: 'READY',
        type: 'PICKUP',
      });
      await expect(
        service.updateOrderStatus(204, { status: 'OUT_FOR_DELIVERY' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
    });

    it('DELIVERY order entering delivery lifecycle (READY -> RIDER_ARRIVED) is allowed', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 205,
        store_id: STORE_ID,
        status: 'READY',
        type: 'DELIVERY',
      });
      prisma.onlineOrder.update.mockResolvedValue({
        id: 205,
        store_id: STORE_ID,
        status: 'RIDER_ARRIVED',
        type: 'DELIVERY',
      });
      const res = await service.updateOrderStatus(205, { status: 'RIDER_ARRIVED' }, CASHIER);
      expect(res.success).toBe(true);
    });

    it('non-delivery order (PICKUP) can settle directly from READY to SETTLED', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 206,
        store_id: STORE_ID,
        status: 'READY',
        type: 'PICKUP',
      });
      prisma.onlineOrder.update.mockResolvedValue({
        id: 206,
        store_id: STORE_ID,
        status: 'SETTLED',
        type: 'PICKUP',
      });
      const res = await service.updateOrderStatus(206, { status: 'SETTLED' }, CASHIER);
      expect(res.success).toBe(true);
    });
  });

  // --- FINDING #6: UNKNOWN STATE MUST NOT BE CANCELLABLE ---
  describe('Finding #6 — Unknown State Must Not Be Cancellable', () => {
    it('UNKNOWN -> CANCELLED is rejected', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 301,
        store_id: STORE_ID,
        status: 'UNKNOWN_LEGACY_STATE',
        type: 'DELIVERY',
      });
      await expect(
        service.updateOrderStatus(301, { status: 'CANCELLED' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
    });

    it('UNKNOWN -> VOIDED is rejected', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 302,
        store_id: STORE_ID,
        status: 'SOME_CORRUPTED_STATUS',
        type: 'DELIVERY',
      });
      await expect(
        service.updateOrderStatus(302, { status: 'VOIDED' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
    });

    it('UNKNOWN -> READY is rejected', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 303,
        store_id: STORE_ID,
        status: 'FOOBAR_STATE',
        type: 'DELIVERY',
      });
      await expect(
        service.updateOrderStatus(303, { status: 'READY' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
    });

    it('UNKNOWN -> OUT_FOR_DELIVERY is rejected', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 304,
        store_id: STORE_ID,
        status: 'MYSTERY_STATUS',
        type: 'DELIVERY',
      });
      await expect(
        service.updateOrderStatus(304, { status: 'OUT_FOR_DELIVERY' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
    });

    it('valid canonical pre-delivery state (CONFIRMED) -> CANCELLED is allowed', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 305,
        store_id: STORE_ID,
        status: 'CONFIRMED',
        type: 'DELIVERY',
      });
      prisma.onlineOrder.update.mockResolvedValue({
        id: 305,
        store_id: STORE_ID,
        status: 'CANCELLED',
      });
      const res = await service.updateOrderStatus(305, { status: 'CANCELLED' }, CASHIER);
      expect(res.success).toBe(true);
    });
  });

  // --- TASK #1: ONLINE ORDER TYPE IMMUTABILITY ---
  describe('Task #1 — OnlineOrder Type Immutability', () => {
    it('Test 1: Existing PICKUP order attempts to change type -> DELIVERY is REJECTED', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 401,
        store_id: STORE_ID,
        status: 'PENDING',
        type: 'PICKUP',
      });
      await expect(
        service.updateOrderStatus(401, { type: 'DELIVERY' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    });

    it('Test 2: Existing DINE_IN order attempts to change type -> DELIVERY is REJECTED', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 402,
        store_id: STORE_ID,
        status: 'PENDING',
        type: 'DINE_IN',
      });
      await expect(
        service.updateOrderStatus(402, { type: 'DELIVERY' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    });

    it('Test 3: Existing DELIVERY order remains type = DELIVERY', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 403,
        store_id: STORE_ID,
        status: 'READY',
        type: 'DELIVERY',
      });
      prisma.onlineOrder.update.mockResolvedValue({
        id: 403,
        store_id: STORE_ID,
        status: 'RIDER_ARRIVED',
        type: 'DELIVERY',
      });
      const res = await service.updateOrderStatus(403, { status: 'RIDER_ARRIVED', notes: 'Rider is here' }, CASHIER);
      expect(res.success).toBe(true);
      expect(prisma.onlineOrder.update).toHaveBeenCalled();
      const updatePayload = prisma.onlineOrder.update.mock.calls[0][0].data;
      expect(updatePayload.type).toBeUndefined();
      expect(res.order.type).toBe('DELIVERY');
    });

    it('Test 4: Normal DELIVERY status transition still works', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 404,
        store_id: STORE_ID,
        status: 'CONFIRMED',
        type: 'DELIVERY',
      });
      prisma.onlineOrder.update.mockResolvedValue({
        id: 404,
        store_id: STORE_ID,
        status: 'KITCHEN_PREPARING',
        type: 'DELIVERY',
      });
      const res = await service.updateOrderStatus(404, { status: 'KITCHEN_PREPARING' }, CASHIER);
      expect(res.success).toBe(true);
      expect(prisma.onlineOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 404 },
          data: expect.objectContaining({ status: 'KITCHEN_PREPARING' }),
        }),
      );
      expect(prisma.onlineOrder.update.mock.calls[0][0].data.type).toBeUndefined();
    });

    it('Test 5: Normal PICKUP status behavior still works', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 405,
        store_id: STORE_ID,
        status: 'READY',
        type: 'PICKUP',
      });
      prisma.onlineOrder.update.mockResolvedValue({
        id: 405,
        store_id: STORE_ID,
        status: 'SETTLED',
        type: 'PICKUP',
      });
      const res = await service.updateOrderStatus(405, { status: 'SETTLED' }, CASHIER);
      expect(res.success).toBe(true);
      expect(prisma.onlineOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 405 },
          data: expect.objectContaining({ status: 'SETTLED' }),
        }),
      );
      expect(prisma.onlineOrder.update.mock.calls[0][0].data.type).toBeUndefined();
    });

    it('Test 6: Normal DINE_IN status behavior still works', async () => {
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 406,
        store_id: STORE_ID,
        status: 'READY',
        type: 'DINE_IN',
      });
      prisma.onlineOrder.update.mockResolvedValue({
        id: 406,
        store_id: STORE_ID,
        status: 'SETTLED',
        type: 'DINE_IN',
      });
      const res = await service.updateOrderStatus(406, { status: 'SETTLED' }, CASHIER);
      expect(res.success).toBe(true);
      expect(prisma.onlineOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 406 },
          data: expect.objectContaining({ status: 'SETTLED' }),
        }),
      );
      expect(prisma.onlineOrder.update.mock.calls[0][0].data.type).toBeUndefined();
    });

    it('Security Test: PICKUP -> DELIVERY -> delivery lifecycle bypass is strictly impossible', async () => {
      // Step A: Attempting to change type directly to DELIVERY is blocked
      prisma.onlineOrder.findUnique.mockResolvedValue({
        id: 407,
        store_id: STORE_ID,
        status: 'READY',
        type: 'PICKUP',
      });
      await expect(
        service.updateOrderStatus(407, { type: 'DELIVERY', status: 'RIDER_ARRIVED' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.onlineOrder.update).not.toHaveBeenCalled();

      // Step B: Even without type in payload, PICKUP cannot jump into delivery lifecycle
      await expect(
        service.updateOrderStatus(407, { status: 'RIDER_ARRIVED' }, CASHIER),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
    });
  });
});


