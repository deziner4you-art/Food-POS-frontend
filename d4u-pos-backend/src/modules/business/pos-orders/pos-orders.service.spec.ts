import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
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
    prisma.order.findUnique.mockResolvedValue(orderAssignedToRiderA); // assigned to a rider, not this manager
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
});
