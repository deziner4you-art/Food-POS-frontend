import { BadRequestException } from '@nestjs/common';
import { CashFlowService } from './cash-flow.service';

describe('CashFlowService opening-cash identity', () => {
  function makeService() {
    const prisma = {
      businessDay: { findFirst: jest.fn().mockResolvedValue({ id: 9, store_id: 3 }) },
      cashFlow: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    return { service: new CashFlowService(prisma as any), prisma };
  }

  it('writes cashier opening cash with an explicit OPENING_FLOAT type', async () => {
    const { service, prisma } = makeService();
    await service.cashIn({ store_id: 3, user_id: 8, amount: 5000, is_opening_float: true });
    expect(prisma.cashFlow.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'OPENING_FLOAT', user_id: 8 }),
    }));
  });

  it('rejects invalid accounting identities instead of falling back to id 1', async () => {
    const { service } = makeService();
    await expect(service.cashIn({ store_id: 0, user_id: 0, amount: 5000 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.cashOut({ store_id: 0, user_id: 0, amount: 100 })).rejects.toBeInstanceOf(BadRequestException);
  });
});
