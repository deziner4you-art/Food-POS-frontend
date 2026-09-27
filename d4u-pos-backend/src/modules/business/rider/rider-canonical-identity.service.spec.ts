import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RiderService } from './rider.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';

describe('RiderService — canonical delivery identity', () => {
  let service: RiderService;
  let prisma: any;
  let gateway: any;
  const rider = { id: 7, name: 'Rider 7', store_id: 1, role: { name: 'Rider' } };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(rider) },
      onlineOrder: {
        findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn(), update: jest.fn(),
      },
      order: {
        findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn(), update: jest.fn(),
      },
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

  it('claims ONLINE:28 and synchronizes only its linked POS twin', async () => {
    const online = { id: 28, store_id: 1, status: 'READY', type: 'DELIVERY', posOrderId: 37 };
    const claimed = { ...online, claimedByRiderId: 7, claimedByRiderName: 'Rider 7' };
    prisma.onlineOrder.findUnique.mockResolvedValueOnce(online);
    prisma.onlineOrder.updateMany.mockResolvedValue({ count: 1 });
    prisma.onlineOrder.findUniqueOrThrow.mockResolvedValue(claimed);
    prisma.order.updateMany.mockResolvedValue({ count: 1 });
    prisma.onlineOrder.findUnique.mockResolvedValueOnce(claimed);

    const result = await service.claimOrder(28, { sub: 7 }, 'ONLINE');

    expect(result.order.entityType).toBe('ONLINE');
    expect(result.order.entityId).toBe(28);
    expect(prisma.onlineOrder.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 28 }) }));
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: 37, order_source: { equals: 'ONLINE', mode: 'insensitive' } },
      data: { rider_id: 7, status: 'READY' },
    });
  });

  it('claims POS:28 without touching OnlineOrder:28', async () => {
    const pos = { id: 28, store_id: 1, status: 'READY', order_source: 'DELIVERY', items: [], createdAt: new Date(), total_amount: 10, rider_id: 7 };
    prisma.order.findUnique.mockResolvedValueOnce(pos);
    prisma.order.updateMany.mockResolvedValue({ count: 1 });
    prisma.order.findUniqueOrThrow.mockResolvedValue(pos);

    const result = await service.claimOrder(28, { sub: 7 }, 'POS');

    expect(result.order.entityType).toBe('POS');
    expect(result.order.entityId).toBe(28);
    expect(prisma.onlineOrder.updateMany).not.toHaveBeenCalled();
    expect(prisma.onlineOrder.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an omitted source when the same numeric id exists in both tables', async () => {
    prisma.onlineOrder.findUnique.mockResolvedValue({ id: 28, store_id: 1, status: 'READY', type: 'DELIVERY' });
    prisma.order.findUnique.mockResolvedValue({ id: 28, store_id: 1, status: 'READY', order_source: 'DELIVERY' });

    await expect(service.claimOrder(28, { sub: 7 })).rejects.toThrow(BadRequestException);
    expect(prisma.onlineOrder.updateMany).not.toHaveBeenCalled();
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a wrong source instead of falling back to the other table', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 28, store_id: 1, status: 'READY', order_source: 'DELIVERY' });

    await expect(service.claimOrder(28, { sub: 7 }, 'ONLINE')).rejects.toThrow(NotFoundException);
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
    expect(prisma.onlineOrder.updateMany).not.toHaveBeenCalled();
  });

  it('force-settles POS:28 and only synchronizes its linked OnlineOrder twin', async () => {
    const pos = { id: 28, store_id: 1, status: 'DISPATCHED', rider_id: null };
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: 'Admin', store_id: 1, role: { name: 'Admin' } });
    prisma.order.findUnique.mockResolvedValueOnce(pos).mockResolvedValueOnce({ ...pos, status: 'SETTLED' });
    prisma.order.update.mockResolvedValue({ ...pos, status: 'SETTLED' });

    const result = await service.adminForceSettleDeliveryException(28, { sub: 1, role: 'Admin' }, 'selected POS', 'POS');

    expect(result.entityType).toBe('POS');
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 28 } }));
    expect(prisma.onlineOrder.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { posOrderId: 28 } }));
    expect(prisma.onlineOrder.update).not.toHaveBeenCalled();
  });

  it('recovers ONLINE:28 and only synchronizes its linked POS twin', async () => {
    const online = { id: 28, store_id: 1, status: 'DISPATCHED', claimedByRiderId: null, posOrderId: 37 };
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: 'Admin', store_id: 1, role: { name: 'Admin' } });
    prisma.onlineOrder.findUnique.mockResolvedValueOnce(online).mockResolvedValueOnce({ ...online, status: 'READY' });
    prisma.onlineOrder.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.adminRecoverDeliveryException(28, { sub: 1, role: 'Admin' }, 'selected ONLINE', 'ONLINE');

    expect(result.entityType).toBe('ONLINE');
    expect(prisma.onlineOrder.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 28, status: 'DISPATCHED', claimedByRiderId: null } }));
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: 37, order_source: { equals: 'ONLINE', mode: 'insensitive' } },
      data: { status: 'READY' },
    });
    expect(prisma.order.update).not.toHaveBeenCalled();
  });
});
