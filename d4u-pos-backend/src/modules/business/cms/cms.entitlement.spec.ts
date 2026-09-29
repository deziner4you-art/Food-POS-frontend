import { BadRequestException } from '@nestjs/common';
import { CmsService } from './cms.service';

describe('CmsService — public identity fail-closed behavior', () => {
  it('does not query banners when store identity is missing or invalid', async () => {
    const prisma = {
      store: { findUnique: jest.fn() },
      cmsBanner: { findMany: jest.fn() },
    };
    const service = new CmsService(prisma as any);

    await expect(service.getBanners(undefined, undefined)).resolves.toEqual([]);
    await expect(service.getBanners(1, 0)).resolves.toEqual([]);
    await expect(service.getBanners(1, 'invalid' as any)).resolves.toEqual([]);
    expect(prisma.store.findUnique).not.toHaveBeenCalled();
    expect(prisma.cmsBanner.findMany).not.toHaveBeenCalled();
  });

  it('resolves banner brand from the store and ignores a mismatched brand query', async () => {
    const prisma = {
      store: { findUnique: jest.fn().mockResolvedValue({ brand_id: 22 }) },
      cmsBanner: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new CmsService(prisma as any);

    await service.getBanners(1, 7);

    expect(prisma.cmsBanner.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        brand_id: 22,
        OR: [
          { target_stores: { none: {} } },
          { target_stores: { some: { id: 7 } } },
        ],
      },
    }));
  });

  it('rejects invalid CMS settings identity instead of defaulting to store 1', async () => {
    const prisma = {
      cmsSettings: { findFirst: jest.fn() },
    };
    const service = new CmsService(prisma as any);

    await expect(service.getSettings(undefined as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.cmsSettings.findFirst).not.toHaveBeenCalled();
  });
});
