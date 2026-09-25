import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { PosOrdersService } from './pos-orders.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { PricingService } from './pricing.service';
import { TablesService } from '../tables/tables.service';

// Task #2Q-B3: PATCH /pos-orders/:id/status now enforces that a caller
// whose real, DB-resolved role is Rider may only progress a delivery
// they've actually claimed (Order.rider_id === authenticatedUser.sub) --
// the POS-native sibling of the same check on OnlineOrdersService. Staff
// callers are completely unaffected.
describe('PosOrdersService.updateDeliveryStatus — Rider ownership (Task #2Q-B3)', () => {
  let service: PosOrdersService;
  let prisma: any;
  let gateway: { broadcast: jest.Mock };

  const RIDER_A = 90;
  const RIDER_B = 91;

  const orderAssignedToRiderA = {
    id: 800,
    store_id: 67,
    status: 'READY',
    rider_id: RIDER_A,
    order_source: 'Delivery',
  };
  const unassignedOrder = { ...orderAssignedToRiderA, id: 801, rider_id: null };

  // formatPosOrderForRider (called on every successful update via
  // gateway.broadcast) needs a fuller shape than the bare fixtures above --
  // used only for the mocked prisma.order.update() return value.
  const fullUpdatedOrder = {
    ...orderAssignedToRiderA,
    items: [],
    total_amount: 500,
    customer: null,
    createdAt: new Date(),
    rider: null,
  };

  beforeEach(async () => {
    prisma = {
      order: { findUnique: jest.fn(), update: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    gateway = { broadcast: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosOrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
        { provide: InventoryService, useValue: {} },
        { provide: CustomersService, useValue: {} },
        { provide: PricingService, useValue: {} },
        { provide: TablesService, useValue: {} },
      ],
    }).compile();

    service = module.get<PosOrdersService>(PosOrdersService);
  });

  it('4. Rider updates their OWN assigned POS delivery order -> ALLOWED', async () => {
    prisma.order.findUnique.mockResolvedValue(orderAssignedToRiderA);
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'Rider' } });
    prisma.order.update.mockResolvedValue({ ...fullUpdatedOrder, status: 'RIDER_ARRIVED' });

    const result = await service.updateDeliveryStatus(800, 'RIDER_ARRIVED', { sub: RIDER_A });

    expect(result.success).toBe(true);
    expect(prisma.order.update).toHaveBeenCalled();
  });

  it("5. Rider updates ANOTHER rider's assigned POS order -> DENIED", async () => {
    prisma.order.findUnique.mockResolvedValue(orderAssignedToRiderA); // assigned to Rider A
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'Rider' } });

    await expect(
      service.updateDeliveryStatus(800, 'RIDER_ARRIVED', { sub: RIDER_B }), // Rider B calling
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('6. Rider updates an UNASSIGNED POS order -> DENIED (must claim first)', async () => {
    prisma.order.findUnique.mockResolvedValue(unassignedOrder);
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'Rider' } });

    await expect(
      service.updateDeliveryStatus(801, 'RIDER_ARRIVED', { sub: RIDER_A }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('7. Staff (non-Rider role) is completely unaffected -- can update any order regardless of rider_id', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...orderAssignedToRiderA, status: 'RIDER_ARRIVED' }); // assigned to a rider, not this manager
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'Manager' } });
    prisma.order.update.mockResolvedValue({ ...fullUpdatedOrder, status: 'PRINT_BILL' });

    const MANAGER_SUB = 6;
    const result = await service.updateDeliveryStatus(800, 'PRINT_BILL', { sub: MANAGER_SUB });

    expect(result.success).toBe(true);
    expect(prisma.order.update).toHaveBeenCalled();
  });

  it('9. A spoofed identity cannot bypass ownership -- only authenticatedUser.sub (the verified JWT identity) is ever consulted', async () => {
    prisma.order.findUnique.mockResolvedValue(orderAssignedToRiderA); // assigned to Rider A (90)
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'Rider' } });

    // Rider B is the REAL authenticated caller. This route's DTO carries no
    // client-supplied rider identity field at all (body is just
    // {status: string}), so there is no spoofing vector here beyond the
    // JWT itself -- this test proves the decision is keyed exactly to
    // authenticatedUser.sub and nothing else reachable from the request.
    await expect(
      service.updateDeliveryStatus(800, 'RIDER_ARRIVED', { sub: RIDER_B }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: RIDER_B },
      select: { role: { select: { name: true } } },
    });
  });

  it('existing behavior unchanged: invalid status is still rejected before ownership is even considered', async () => {
    await expect(
      service.updateDeliveryStatus(800, 'NOT_A_REAL_STATUS', { sub: RIDER_A }),
    ).rejects.toThrow('Invalid delivery status: NOT_A_REAL_STATUS');
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it('STATE GUARD: PENDING order cannot enter delivery lifecycle directly', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...orderAssignedToRiderA, status: 'PENDING' });
    await expect(
      service.updateDeliveryStatus(800, 'RIDER_ARRIVED', { sub: 1 }),
    ).rejects.toThrow('Order must reach READY before entering the delivery lifecycle');
  });

  it('STATE GUARD: PREPARING order cannot skip directly to PRINT_BILL', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...orderAssignedToRiderA, status: 'PREPARING' });
    await expect(
      service.updateDeliveryStatus(800, 'PRINT_BILL', { sub: 1 }),
    ).rejects.toThrow('Order must reach READY before entering the delivery lifecycle');
  });

  it('STATE GUARD: READY order cannot skip directly to OUT_FOR_DELIVERY', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...orderAssignedToRiderA, status: 'READY' });
    await expect(
      service.updateDeliveryStatus(800, 'OUT_FOR_DELIVERY', { sub: 1 }),
    ).rejects.toThrow('Transitions must follow the delivery sequence');
  });

  it('STATE GUARD: READY order cannot skip directly to DELIVERED', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...orderAssignedToRiderA, status: 'READY' });
    await expect(
      service.updateDeliveryStatus(800, 'DELIVERED', { sub: 1 }),
    ).rejects.toThrow('Transitions must follow the delivery sequence');
  });

  it('STATE GUARD: DELIVERED order can transition directly to SETTLED for immediate cash settlement', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...orderAssignedToRiderA, status: 'DELIVERED' });
    prisma.order.update.mockResolvedValue({ ...fullUpdatedOrder, status: 'SETTLED' });
    const result = await service.updateDeliveryStatus(800, 'SETTLED', { sub: 1 });
    expect(result.success).toBe(true);
  });
});

describe('PosOrdersService.settleOrder — Delivery lifecycle protection', () => {
  let service: PosOrdersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
      cashFlow: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosOrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: { broadcast: jest.fn() } },
        { provide: InventoryService, useValue: {} },
        { provide: CustomersService, useValue: {} },
        { provide: PricingService, useValue: {} },
        { provide: TablesService, useValue: { releaseTableByOrderId: jest.fn() } },
      ],
    }).compile();

    service = module.get<PosOrdersService>(PosOrdersService);
  });

  it('rejects premature settlement of Delivery order in PENDING, PREPARING, or READY state', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 888,
      order_source: 'Delivery',
      status: 'PREPARING',
      total_amount: 1200,
    });

    await expect(
      service.settleOrder(888, { payment_method: 'CASH' }),
    ).rejects.toThrow(/cannot be settled while in state 'PREPARING'/);
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it('allows settlement of Delivery order when in WAITING_CASH_SETTLEMENT state', async () => {
    const deliveryOrder = {
      id: 888,
      order_source: 'Delivery',
      status: 'WAITING_CASH_SETTLEMENT',
      total_amount: 1200,
      delivery_info: {},
      created_by: 1,
      createdAt: new Date(),
      items: [],
      customer: null,
      rider: null,
    };
    prisma.order.findUnique.mockResolvedValue(deliveryOrder);

    const result = await service.settleOrder(888, { payment_method: 'CASH', amount_received: 1200 });
    expect(result.success).toBe(true);
    expect(prisma.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 888, status: { not: 'SETTLED' } },
      data: expect.objectContaining({
        status: 'SETTLED',
        payment_status: 'PAID',
      }),
    }));
  });

  describe('Finding #2 — POS Delivery Source Isolation', () => {
    it('DELIVERY READY -> RIDER_ARRIVED succeeds when valid', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 701,
        order_source: 'DELIVERY',
        status: 'READY',
        store_id: 1,
      });
      prisma.order.update.mockResolvedValue({
        id: 701,
        order_source: 'DELIVERY',
        status: 'RIDER_ARRIVED',
        store_id: 1,
        items: [],
        createdAt: new Date(),
        total_amount: 100,
      });

      const res = await service.updateDeliveryStatus(701, 'RIDER_ARRIVED');
      expect(res.success).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 701 },
        data: { status: 'RIDER_ARRIVED' },
      }));
    });

    it('PICKUP READY -> RIDER_ARRIVED rejected', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 702,
        order_source: 'PICKUP',
        status: 'READY',
        store_id: 1,
      });

      await expect(
        service.updateDeliveryStatus(702, 'RIDER_ARRIVED'),
      ).rejects.toThrow(BadRequestException);
    });

    it('WALK_IN READY -> RIDER_ARRIVED rejected', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 703,
        order_source: 'WALK_IN',
        status: 'READY',
        store_id: 1,
      });

      await expect(
        service.updateDeliveryStatus(703, 'RIDER_ARRIVED'),
      ).rejects.toThrow(BadRequestException);
    });

    it('ONLINE READY -> RIDER_ARRIVED rejected', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 704,
        order_source: 'ONLINE',
        status: 'READY',
        store_id: 1,
      });

      await expect(
        service.updateDeliveryStatus(704, 'RIDER_ARRIVED'),
      ).rejects.toThrow(BadRequestException);
    });

    it('non-delivery order cannot reach DISPATCHED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 705,
        order_source: 'PICKUP',
        status: 'PRINT_BILL',
        store_id: 1,
      });

      await expect(
        service.updateDeliveryStatus(705, 'DISPATCHED'),
      ).rejects.toThrow(BadRequestException);
    });

    it('non-delivery order cannot reach OUT_FOR_DELIVERY', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 706,
        order_source: 'DINE_IN',
        status: 'DISPATCHED',
        store_id: 1,
      });

      await expect(
        service.updateDeliveryStatus(706, 'OUT_FOR_DELIVERY'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});


