import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RiderService } from './rider.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';

describe('RiderService — unified waiter order clearance', () => {
  let service: RiderService;
  let prisma: any;
  let gateway: any;

  const manager = {
    id: 50,
    sub: 50,
    name: 'Manager',
    store_id: 1,
    role: { name: 'Manager' },
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(manager) },
      onlineOrder: { findMany: jest.fn().mockResolvedValue([]) },
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      kOT: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      restaurantTable: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      businessDay: { findFirst: jest.fn().mockResolvedValue({ id: 10 }) },
      systemAuditLog: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) => callback(prisma)),
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

  it('voids a stale waiter order, cancels its KOT, and releases the table atomically', async () => {
    const waiterOrder = {
      id: 9,
      store_id: 1,
      status: 'PENDING',
      order_source: 'WAITER',
      terminal_session_id: 7,
      table_no: 'T1',
      business_day_id: 9,
      createdAt: new Date(),
    };
    prisma.order.findUnique.mockResolvedValue(waiterOrder);

    const result = await service.adminClearWaiterOrder(9, manager, 'Stale waiter terminal order');

    expect(result).toMatchObject({
      success: true,
      entityType: 'POS',
      orderId: 9,
      previousStatus: 'PENDING',
      newStatus: 'VOIDED',
      tableReleased: true,
    });
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: 9, status: 'PENDING' },
      data: {
        status: 'VOIDED',
        void_reason: 'Stale waiter terminal order',
        void_approved_by: 50,
      },
    });
    expect(prisma.kOT.updateMany).toHaveBeenCalledWith({
      where: { order_id: 9, status: { not: 'CANCELLED' } },
      data: { status: 'CANCELLED' },
    });
    expect(prisma.restaurantTable.updateMany).toHaveBeenCalledWith({
      where: { current_order_id: 9 },
      data: { status: 'AVAILABLE', current_order_id: null },
    });
    expect(gateway.broadcast).toHaveBeenCalledWith(
      'order_voided',
      expect.objectContaining({ entityType: 'POS', entityId: 9, tableReleased: true }),
      'store_1',
    );
  });

  it('also recognizes a terminal-session waiter order when its source label is legacy', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 10,
      store_id: 1,
      status: 'SETTLED',
      order_source: 'WALKIN',
      terminal_session_id: 7,
      table_no: 'T2',
      business_day_id: 10,
      createdAt: new Date(),
    });

    const result = await service.adminClearWaiterOrder(10, manager, 'Release stale table pointer');

    expect(result.newStatus).toBe('SETTLED');
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
    expect(prisma.kOT.updateMany).not.toHaveBeenCalled();
    expect(prisma.restaurantTable.updateMany).toHaveBeenCalled();
  });

  it('rejects a delivery/POS order from the waiter-clear action', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 11,
      store_id: 1,
      status: 'READY',
      order_source: 'DELIVERY',
      terminal_session_id: null,
    });

    await expect(service.adminClearWaiterOrder(11, manager, 'wrong queue'))
      .rejects.toThrow(BadRequestException);
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
    expect(prisma.restaurantTable.updateMany).not.toHaveBeenCalled();
  });

  it('lists a stale occupied waiter table in the same clearance queue', async () => {
    const oldWaiterOrder = {
      id: 9,
      store_id: 1,
      status: 'PENDING',
      order_source: 'WAITER',
      terminal_session_id: 7,
      table_no: 'T1',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      customer: null,
    };
    prisma.onlineOrder.findMany.mockResolvedValue([]);
    prisma.order.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([oldWaiterOrder]);
    prisma.restaurantTable.findMany.mockResolvedValue([
      { id: 1, label: 'T1', current_order_id: 9 },
    ]);

    const records = await service.getDeliveryExceptions('1', manager);

    expect(records).toEqual([
      expect.objectContaining({
        entityType: 'POS',
        entityId: 9,
        source: 'WAITER',
        clearAction: 'WAITER_CLEAR',
        table_no: 'T1',
      }),
    ]);
  });

  it('rejects rider callers', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 60,
      role: { name: 'Rider' },
      store_id: 1,
    });

    await expect(service.adminClearWaiterOrder(9, { sub: 60 }, 'not allowed'))
      .rejects.toThrow(ForbiddenException);
  });
});
