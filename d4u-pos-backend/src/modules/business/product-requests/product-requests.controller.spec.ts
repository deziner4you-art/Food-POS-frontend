import { ForbiddenException } from '@nestjs/common';
import { ProductRequestsController } from './product-requests.controller';

describe('ProductRequestsController tenant boundary (P0.4-C)', () => {
  let controller: ProductRequestsController;
  let service: any;
  let prisma: any;

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      getById: jest.fn().mockResolvedValue({ id: 5, store_id: 7 }),
      create: jest.fn().mockResolvedValue({ id: 5, store_id: 7 }),
      update: jest.fn(),
      submit: jest.fn(),
      review: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      returnForRevision: jest.fn(),
      publish: jest.fn(),
      setImage: jest.fn(),
      removeImage: jest.fn(),
    };
    prisma = {
      store: { findUnique: jest.fn().mockResolvedValue({ id: 7, brand_id: 10 }) },
      user: { findUnique: jest.fn().mockResolvedValue({ role: { name: 'Cashier' } }) },
    };
    controller = new ProductRequestsController(service, prisma);
  });

  const ownUser = { sub: 5, active_store_id: 7, active_brand_id: 10 };

  it('requires the caller active store when list store_id is omitted', async () => {
    await controller.list(ownUser, undefined, undefined, undefined);
    expect(service.list).toHaveBeenCalledWith({ store_id: 7, status: undefined, search: undefined });
  });

  it('rejects cross-store create before service execution', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 99, brand_id: 10 });
    await expect(controller.create(ownUser, { store_id: 99 } as any)).rejects.toThrow(ForbiddenException);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('rejects cross-store detail access using server-loaded request ownership', async () => {
    service.getById.mockResolvedValue({ id: 5, store_id: 99 });
    prisma.store.findUnique.mockResolvedValue({ id: 99, brand_id: 10 });
    await expect(controller.getById(ownUser, '5')).rejects.toThrow(ForbiddenException);
  });

  it('rejects cross-brand workflow mutation before calling the service', async () => {
    service.getById.mockResolvedValue({ id: 5, store_id: 99 });
    prisma.store.findUnique.mockResolvedValue({ id: 99, brand_id: 77 });
    await expect(controller.approve(ownUser, '5', {} as any)).rejects.toThrow(ForbiddenException);
    expect(service.approve).not.toHaveBeenCalled();
  });

  it('allows same-store update after ownership verification', async () => {
    service.update.mockResolvedValue({ id: 5 });
    await controller.update(ownUser, '5', {} as any);
    expect(service.update).toHaveBeenCalledWith(5, {});
  });
});
