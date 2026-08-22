import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: any;

  // Two different brands, two different stores, one belonging to each.
  const STORE_A = { id: 67, brand_id: 1 };
  const STORE_B = { id: 68, brand_id: 2 };
  const USER_A = { sub: 88, active_store_id: STORE_A.id }; // real staff shape
  const WAITER_B = { sub: 'terminal-session-9', role: 'Waiter', store_id: STORE_B.id }; // synthetic session shape
  // Real staff JWTs also carry active_brand_id directly (see
  // AuthService.buildTokenPayload) -- USER_A above intentionally omits it
  // to keep the #2M findByPhone tests focused on store-only resolution;
  // getCustomers needs the brand claim, so it gets its own fixture.
  const STAFF_BRAND_A = { sub: 88, active_store_id: STORE_A.id, active_brand_id: STORE_A.brand_id };

  const CUSTOMER_A = {
    id: 500, brand_id: STORE_A.brand_id, phone: '+923000000001', name: 'Customer of Brand A', addresses: [],
  };

  beforeEach(async () => {
    prisma = {
      store: { findUnique: jest.fn() },
      customer: { findUnique: jest.fn(), findMany: jest.fn() },
      onlineOrder: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByPhone — tenant isolation (Task #2M)', () => {
    it('1. a user from Store/Brand A looks up a customer belonging to A -> customer is returned', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A);
      prisma.customer.findUnique.mockResolvedValue(CUSTOMER_A);

      const result = await service.findByPhone('+923000000001', USER_A);

      expect(result).toEqual(CUSTOMER_A);
      expect(prisma.store.findUnique).toHaveBeenCalledWith({ where: { id: STORE_A.id }, select: { brand_id: true } });
    });

    it('2. a user from Store/Brand B looks up a phone number that only belongs to a Brand A customer -> not found, never returned', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B); // caller is scoped to brand 2
      prisma.customer.findUnique.mockResolvedValue(CUSTOMER_A); // but the only real record for this phone is brand 1's

      await expect(service.findByPhone('+923000000001', WAITER_B)).rejects.toThrow(NotFoundException);
    });

    // Task #2M note: Customer.phone is @unique globally in the schema (see
    // prisma/schema.prisma), so "the same phone exists in both A and B" as
    // two distinct customer rows is not a state the database can actually
    // be in -- Postgres itself would reject the second insert. The real,
    // equivalent security property -- a caller only ever sees the single
    // real record when it's their own brand's, and never sees it (gets the
    // same NotFoundException as a genuinely nonexistent phone) when it
    // isn't -- is exactly what tests 1 and 2 above verify. This test
    // confirms the two outcomes are indistinguishable from the caller's
    // side: same exception type, same message either way.
    it('3 (adapted). cross-brand denial and genuine not-found are indistinguishable to the caller', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);
      prisma.customer.findUnique.mockResolvedValue(CUSTOMER_A); // exists, but for a different brand
      const crossBrandError = await service.findByPhone('+923000000001', WAITER_B).catch((e) => e);

      prisma.customer.findUnique.mockResolvedValue(null); // genuinely doesn't exist anywhere
      const notFoundError = await service.findByPhone('+923000009999', WAITER_B).catch((e) => e);

      expect(crossBrandError).toBeInstanceOf(NotFoundException);
      expect(notFoundError).toBeInstanceOf(NotFoundException);
      expect(crossBrandError.message).toBe(notFoundError.message);
    });

    it('4. missing authenticated store/tenant scope -> rejected safely, no customer query attempted', async () => {
      await expect(service.findByPhone('+923000000001', undefined)).rejects.toThrow(BadRequestException);
      await expect(service.findByPhone('+923000000001', {})).rejects.toThrow(BadRequestException);
      expect(prisma.store.findUnique).not.toHaveBeenCalled();
      expect(prisma.customer.findUnique).not.toHaveBeenCalled();
    });

    it('4b. authenticated store_id does not correspond to any real store -> rejected safely', async () => {
      prisma.store.findUnique.mockResolvedValue(null);
      await expect(service.findByPhone('+923000000001', USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.customer.findUnique).not.toHaveBeenCalled();
    });

    it('5. existing valid lookup behavior (query shape, addresses include, response) is unchanged for a same-brand match', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A);
      prisma.customer.findUnique.mockResolvedValue(CUSTOMER_A);

      // normalizePhone() strips everything but digits (including a leading
      // '+') -- unchanged behavior, still applied before the query exactly
      // as before this fix.
      await service.findByPhone('+92 300-0000001', USER_A);

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { phone: '923000000001' },
        include: { addresses: { orderBy: [{ is_default: 'desc' }, { id: 'asc' }] } },
      });
    });

    it('6. the synthetic Waiter session shape (store_id, no brand claim at all) is resolved correctly via its store', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);
      prisma.customer.findUnique.mockResolvedValue({ ...CUSTOMER_A, brand_id: STORE_B.brand_id, id: 501 });

      const result = await service.findByPhone('+923000000002', WAITER_B);

      expect(prisma.store.findUnique).toHaveBeenCalledWith({ where: { id: STORE_B.id }, select: { brand_id: true } });
      expect(result.id).toBe(501);
    });
  });

  // Task #2Q-D1: brand_id used to be a client-supplied argument, trusted
  // outright for tenant scoping. It is now resolved exclusively from
  // authenticatedUser.active_brand_id (the verified JWT claim) -- these
  // tests prove the actual Prisma query is always keyed to that value,
  // never anything a caller could otherwise influence.
  describe('getCustomers — tenant isolation (Task #2Q-D1)', () => {
    it('6. valid same-brand search is unchanged -- query shape, filters, sort, response all preserved', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A);
      prisma.customer.findMany.mockResolvedValue([CUSTOMER_A]);

      const result = await service.getCustomers(STAFF_BRAND_A, STORE_A.id, 'Ali');

      expect(result).toEqual([CUSTOMER_A]);
      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          brand_id: STORE_A.brand_id,
          AND: [
            { OR: [{ orders: { some: { store_id: STORE_A.id } } }, { total_orders: 0 }] },
            { OR: [{ phone: { contains: 'Ali' } }, { name: { contains: 'Ali', mode: 'insensitive' } }] },
          ],
        },
        orderBy: { total_orders: 'desc' },
        include: { _count: { select: { addresses: true } } },
      });
    });

    it('7. the query is always scoped to authenticatedUser.active_brand_id -- there is no parameter left for a caller to override it with', async () => {
      prisma.customer.findMany.mockResolvedValue([]);

      await service.getCustomers(STAFF_BRAND_A); // no store_id/search -- brand-only

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { brand_id: STAFF_BRAND_A.active_brand_id },
        orderBy: { total_orders: 'desc' },
        include: { _count: { select: { addresses: true } } },
      });
    });

    it("8. a store_id belonging to a DIFFERENT brand than the caller's is rejected -- never used to narrow or leak that brand's stores", async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B); // store_id resolves to Brand 2

      await expect(service.getCustomers(STAFF_BRAND_A, STORE_B.id)).rejects.toThrow(BadRequestException); // STAFF_BRAND_A is Brand 1
      expect(prisma.customer.findMany).not.toHaveBeenCalled();
    });

    it('9. missing/invalid authenticated brand context -> rejected safely, no customer query attempted', async () => {
      await expect(service.getCustomers(undefined)).rejects.toThrow(BadRequestException);
      await expect(service.getCustomers(WAITER_B)).rejects.toThrow(BadRequestException); // synthetic session has no brand claim at all
      expect(prisma.customer.findMany).not.toHaveBeenCalled();
    });
  });

  // Task #2Q-D1: the internal OnlineOrder query used to be unscoped by any
  // tenant boundary -- same class of leak as OnlineOrdersService.
  // getOrdersByPhone, reached via a customer id instead of a phone param.
  describe('getCustomerOrders — tenant isolation (Task #2Q-D1)', () => {
    const CUSTOMER_WITH_ORDERS = { id: 500, phone: '923000000001', orders: [], addresses: [] };

    it('10. same-store lookup -- the OnlineOrder query is constrained to the caller\'s own store', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A);
      prisma.customer.findUnique.mockResolvedValue(CUSTOMER_WITH_ORDERS);
      prisma.onlineOrder.findMany.mockResolvedValue([]);

      await service.getCustomerOrders(500, USER_A);

      expect(prisma.onlineOrder.findMany).toHaveBeenCalledWith({
        where: { customerPhone: '923000000001', store_id: STORE_A.id },
        orderBy: { id: 'desc' },
        take: 50,
      });
    });

    it("11. cannot return another store's OnlineOrders -- the query is always keyed to the authenticated caller's own store, never any other", async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);
      prisma.customer.findUnique.mockResolvedValue(CUSTOMER_WITH_ORDERS);
      prisma.onlineOrder.findMany.mockResolvedValue([]);

      await service.getCustomerOrders(500, WAITER_B); // synthetic session, store B

      const calledWhere = prisma.onlineOrder.findMany.mock.calls[0][0].where;
      expect(calledWhere.store_id).toBe(STORE_B.id);
      expect(calledWhere.store_id).not.toBe(STORE_A.id);
    });

    it('12. missing/invalid authenticated store -> rejected safely, no customer or order query attempted', async () => {
      await expect(service.getCustomerOrders(500, undefined)).rejects.toThrow(BadRequestException);
      expect(prisma.customer.findUnique).not.toHaveBeenCalled();
      expect(prisma.onlineOrder.findMany).not.toHaveBeenCalled();
    });

    it('13. the synthetic Waiter session shape (store_id, no brand claim) resolves the store correctly', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);
      prisma.customer.findUnique.mockResolvedValue(CUSTOMER_WITH_ORDERS);
      prisma.onlineOrder.findMany.mockResolvedValue([]);

      await service.getCustomerOrders(500, WAITER_B);

      expect(prisma.store.findUnique).toHaveBeenCalledWith({ where: { id: STORE_B.id } });
    });
  });
});
