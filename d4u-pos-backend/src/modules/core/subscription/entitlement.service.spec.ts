import { ForbiddenException } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';

describe('EntitlementService', () => {
  const packageRecord = {
    id: 3,
    code: 'POS_KDS',
    status: 'ACTIVE',
    modules: [
      { module_key: 'BASE_POS' },
      { module_key: 'KDS' },
      { module_key: 'RIDER' },
    ],
  };

  function makePrisma(overrides: any = {}) {
    const store = {
      id: 25,
      brand_id: 10,
      name: 'Branch 25',
      brand: { id: 10, name: 'Brand 10' },
      saas_package: packageRecord,
    };
    return {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          brand_id: 10,
          store_id: 25,
          role: { name: 'Cashier' },
        }),
      },
      store: { findUnique: jest.fn().mockResolvedValue(store) },
      subscription: {
        findUnique: jest.fn().mockResolvedValue({
          brand_id: 10,
          package_id: 3,
          status: 'ACTIVE',
          expiry_date: new Date(Date.now() + 86400000),
          package: packageRecord,
        }),
      },
      ...overrides,
    };
  }

  it('allows an entitled active store and exposes only purchased capabilities', async () => {
    const service = new EntitlementService(makePrisma());
    const result = await service.resolveForAuthenticatedUser({
      sub: 7,
      active_brand_id: 10,
      active_store_id: 25,
    });

    expect(result.entitlement).toMatchObject({ enabled: true, reason: null });
    expect(result.tenant).toMatchObject({ brandId: 10, storeId: 25 });
    expect(result.capabilities).toMatchObject({
      pos: true,
      kotPrint: true,
      kds: true,
      rider: true,
      marketing: false,
      website: false,
    });
  });

  it('treats KOT printing as a base POS capability without implying KDS', async () => {
    const baseOnly = makePrisma();
    baseOnly.store.findUnique.mockResolvedValue({
      id: 25,
      brand_id: 10,
      name: 'Branch 25',
      brand: { id: 10, name: 'Brand 10' },
      saas_package: { ...packageRecord, modules: [{ module_key: 'BASE_POS' }] },
    });
    const service = new EntitlementService(baseOnly);
    const result = await service.resolveForStore(25);

    expect(service.isCapabilityEnabled(result, 'KOT_PRINT')).toBe(true);
    expect(service.isCapabilityEnabled(result, 'KDS')).toBe(false);
  });

  it('fails closed when the brand subscription is missing', async () => {
    const prisma = makePrisma();
    prisma.subscription.findUnique.mockResolvedValue(null);
    const result = await new EntitlementService(prisma).resolveForStore(25);

    expect(result.entitlement).toMatchObject({ enabled: false, reason: 'SUBSCRIPTION_NOT_FOUND' });
    expect(result.modules).toEqual([]);
    expect(result.capabilities.kds).toBe(false);
  });

  it('fails closed for expired or suspended subscriptions', async () => {
    const prisma = makePrisma();
    prisma.subscription.findUnique.mockResolvedValue({
      package_id: 3,
      status: 'SUSPENDED',
      expiry_date: new Date(Date.now() + 86400000),
      package: packageRecord,
    });
    const result = await new EntitlementService(prisma).resolveForStore(25);

    expect(result.entitlement.enabled).toBe(false);
    expect(result.capabilities.pos).toBe(false);
  });

  it('rejects a requested store outside the authenticated active workspace', async () => {
    const service = new EntitlementService(makePrisma());
    await expect(service.resolveForAuthenticatedUser({
      sub: 7,
      active_brand_id: 10,
      active_store_id: 25,
    }, 99)).rejects.toThrow(ForbiddenException);
  });

  it('fails closed when the store package and subscription package disagree', async () => {
    const prisma = makePrisma();
    prisma.subscription.findUnique.mockResolvedValue({
      package_id: 99,
      status: 'ACTIVE',
      expiry_date: new Date(Date.now() + 86400000),
      package: { ...packageRecord, id: 99 },
    });
    const result = await new EntitlementService(prisma).resolveForStore(25);

    expect(result.entitlement).toMatchObject({ enabled: false, reason: 'PACKAGE_SUBSCRIPTION_MISMATCH' });
    expect(result.capabilities.kds).toBe(false);
  });
});
