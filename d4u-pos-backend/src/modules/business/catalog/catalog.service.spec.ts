import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let prisma: any;

  // Two stores in the same brand (A1, A2), one store in a different brand (B).
  const STORE_A1 = { id: 67, brand_id: 1 };
  const STORE_A2 = { id: 70, brand_id: 1 };
  const STORE_B = { id: 68, brand_id: 2 };
  const USER_A = { sub: 88, active_brand_id: 1 };

  const CATEGORY_A1 = { id: 500, store_id: STORE_A1.id, name: 'Category at Store A1', _count: { products: 0 } };
  const CATEGORY_A2 = { id: 501, store_id: STORE_A2.id, name: 'Category at Store A2', _count: { products: 0 } };
  const PRODUCT_A1 = { id: 900, store_id: STORE_A1.id, name: 'Product at Store A1', categories: [], modifierGroups: [] };

  beforeEach(async () => {
    prisma = {
      store: { findUnique: jest.fn(), findMany: jest.fn() },
      category: { findMany: jest.fn() },
      product: { findMany: jest.fn() },
      menu: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CatalogService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Task #2R-F1: brand-boundary tenant isolation for getCategories/
  // getProducts/getMenus/exportProductsCsv/importProductsCsv. #2R-F
  // established the brand, not the individual store, is the real ownership
  // boundary for catalog data; this suite verifies the actual Prisma query
  // shapes, not just HTTP-level outcomes.
  describe('getCategories — brand-boundary tenant isolation (Task #2R-F1)', () => {
    it('1. authenticated user with brand A + own store A1 -> own catalog accessible', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.category.findMany.mockResolvedValue([CATEGORY_A1]);

      const result = await service.getCategories({ store_id: STORE_A1.id }, USER_A);

      expect(result).toEqual([{ ...CATEGORY_A1, product_count: 0 }]);
      expect(prisma.store.findUnique).toHaveBeenCalledWith({ where: { id: STORE_A1.id }, select: { brand_id: true } });
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ store_id: { in: [STORE_A1.id] } }) }),
      );
    });

    it('2. same user supplies a store belonging to brand B -> rejected, no category query attempted', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(service.getCategories({ store_id: STORE_B.id }, USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.category.findMany).not.toHaveBeenCalled();
    });

    it('3. cannot retrieve brand B data merely by changing store_id -- same rejection regardless of which brand-B store is supplied', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);
      const err1 = await service.getCategories({ store_id: STORE_B.id }, USER_A).catch((e) => e);

      prisma.store.findUnique.mockResolvedValue({ id: 999, brand_id: 2 });
      const err2 = await service.getCategories({ store_id: 999 }, USER_A).catch((e) => e);

      expect(err1).toBeInstanceOf(BadRequestException);
      expect(err2).toBeInstanceOf(BadRequestException);
      expect(prisma.category.findMany).not.toHaveBeenCalled();
    });

    it('4. omitting store_id resolves to the caller\'s own brand\'s stores only, never a global/unfiltered query', async () => {
      prisma.store.findMany.mockResolvedValue([STORE_A1, STORE_A2]);
      prisma.category.findMany.mockResolvedValue([CATEGORY_A1, CATEGORY_A2]);

      await service.getCategories({}, USER_A);

      expect(prisma.store.findMany).toHaveBeenCalledWith({ where: { brand_id: 1 }, select: { id: true } });
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ store_id: { in: [STORE_A1.id, STORE_A2.id] } }) }),
      );
      // never an unfiltered/global query
      const actualWhere = prisma.category.findMany.mock.calls[0][0].where;
      expect(actualWhere.store_id).not.toBeUndefined();
    });

    it('5. multi-store catalog assignment within the same brand remains accessible when store_id is omitted', async () => {
      prisma.store.findMany.mockResolvedValue([STORE_A1, STORE_A2]);
      prisma.category.findMany.mockResolvedValue([CATEGORY_A1, CATEGORY_A2]);

      const result = await service.getCategories({}, USER_A);

      expect(result.map((c) => c.id)).toEqual([CATEGORY_A1.id, CATEGORY_A2.id]);
    });

    it('rejects when there is no usable authenticated brand context, no query attempted', async () => {
      await expect(service.getCategories({}, undefined)).rejects.toThrow(BadRequestException);
      await expect(service.getCategories({}, {})).rejects.toThrow(BadRequestException);
      expect(prisma.store.findMany).not.toHaveBeenCalled();
      expect(prisma.category.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getProducts — brand-boundary tenant isolation (Task #2R-F1)', () => {
    it('own brand + own store -> accessible', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.product.findMany.mockResolvedValue([PRODUCT_A1]);

      const result = await service.getProducts({ store_id: STORE_A1.id }, USER_A);

      expect(result.map((p: any) => p.id)).toEqual([PRODUCT_A1.id]);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ store_id: { in: [STORE_A1.id] } }) }),
      );
    });

    it('cross-brand store_id -> rejected, no product query attempted', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(service.getProducts({ store_id: STORE_B.id }, USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('omitted store_id scopes to the caller\'s own brand\'s stores only', async () => {
      prisma.store.findMany.mockResolvedValue([STORE_A1, STORE_A2]);
      prisma.product.findMany.mockResolvedValue([PRODUCT_A1]);

      await service.getProducts({}, USER_A);

      expect(prisma.store.findMany).toHaveBeenCalledWith({ where: { brand_id: 1 }, select: { id: true } });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ store_id: { in: [STORE_A1.id, STORE_A2.id] } }) }),
      );
    });
  });

  describe('exportProductsCsv — brand boundary (Task #2R-F1)', () => {
    it('7. export cannot cross the brand boundary -- inherits getProducts\' rejection', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(service.exportProductsCsv(STORE_B.id, USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });
  });

  describe('importProductsCsv — brand boundary (Task #2R-F1)', () => {
    it('6. import rejects a store belonging to another brand before touching the CSV/product data at all', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(
        service.importProductsCsv(STORE_B.id, Buffer.from('product_name\nFoo'), USER_A),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMenus — brand boundary (Task #2R-F1)', () => {
    it('scopes to the caller\'s own brand -- previously returned every brand\'s menus unfiltered', async () => {
      prisma.menu.findMany.mockResolvedValue([]);

      await service.getMenus({}, USER_A);

      expect(prisma.menu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { brand_id: 1 } }),
      );
    });

    it('rejects with no authenticated brand context', async () => {
      await expect(service.getMenus({}, undefined)).rejects.toThrow(BadRequestException);
      expect(prisma.menu.findMany).not.toHaveBeenCalled();
    });
  });

  // 8. syncCatalogForPos is the real, correctly-implemented POS-facing
  // endpoint (creator-store OR assigned_stores OR menu-assignment) --
  // #2R-F/#2R-F1 must never weaken it. It takes only a raw store_id (no
  // authenticatedUser at all, unchanged), so this confirms its query shape
  // is exactly what it was before this task.
  describe('syncCatalogForPos — unchanged (Task #2R-F1 must not touch this)', () => {
    it('still queries by creator-store OR assigned_stores OR menu-store-assignment, no brand check added', async () => {
      prisma.category.findMany.mockResolvedValue([]);
      prisma.product.findMany.mockResolvedValue([]);

      await service.syncCatalogForPos(STORE_A1.id);

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { store_id: STORE_A1.id },
            { assigned_stores: { some: { id: STORE_A1.id } } },
            { menu: { stores: { some: { id: STORE_A1.id } } } },
          ],
        },
      });
    });
  });

  // 9. This service never special-cases any role name (including Super
  // Admin) -- that bypass lives entirely in PermissionsGuard (unchanged by
  // this task) and was never touched here. A caller's data is always scoped
  // to whatever brand their own active_brand_id resolves to, matching every
  // other tenant-isolation fix in this series (#2M, #2Q-D1) -- confirmed
  // here rather than assumed.
  describe('no role-based bypass at the service layer (Task #2R-F1)', () => {
    it('a caller whose role happens to be Super Admin is still scoped by their own active_brand_id -- no special-casing added', async () => {
      const SUPER_ADMIN_USER = { sub: 1, role: 'Super Admin', active_brand_id: 1 };
      prisma.store.findMany.mockResolvedValue([STORE_A1, STORE_A2]);
      prisma.category.findMany.mockResolvedValue([]);

      await service.getCategories({}, SUPER_ADMIN_USER);

      expect(prisma.store.findMany).toHaveBeenCalledWith({ where: { brand_id: 1 }, select: { id: true } });
    });
  });
});
