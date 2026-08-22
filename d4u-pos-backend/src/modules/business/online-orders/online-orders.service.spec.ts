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
