import { SubscriptionService } from './subscription.service';

describe('SubscriptionService marketing entitlement fail-closed behavior', () => {
  const activeSubscription = {
    brand_id: 10,
    package_id: 3,
    status: 'ACTIVE',
    expiry_date: new Date(Date.now() + 86400000),
  };

  function makePrisma(store: any, subscription: any = activeSubscription) {
    return {
      store: { findUnique: jest.fn().mockResolvedValue(store) },
      subscription: { findUnique: jest.fn().mockResolvedValue(subscription) },
    };
  }

  it('returns disabled capabilities when no package exists', async () => {
    const prisma = makePrisma(null);
    const result = await new SubscriptionService(prisma).getMarketingCapabilities(7);

    expect(result).toEqual({
      enabled: false,
      allowedCampaignTypes: [],
      socialPublishing: false,
      tvBoard: false,
      analytics: false,
    });
  });

  it('returns disabled capabilities when the package has no MARKETING module', async () => {
    const prisma = makePrisma({
      id: 7,
      brand_id: 10,
      saas_package: {
        id: 3,
        code: 'POS_ONLY',
        name: 'POS Only',
        status: 'ACTIVE',
        modules: [{ module_key: 'BASE_POS' }],
      },
    });
    const result = await new SubscriptionService(prisma).getMarketingCapabilities(7);

    expect(result.enabled).toBe(false);
    expect(result.allowedCampaignTypes).toEqual([]);
  });

  it('enables campaigns only for an active matching package with MARKETING', async () => {
    const prisma = makePrisma({
      id: 7,
      brand_id: 10,
      saas_package: {
        id: 3,
        code: 'POS_MARKETING',
        name: 'POS + Marketing',
        status: 'ACTIVE',
        modules: [
          { module_key: 'BASE_POS' },
          { module_key: 'MARKETING', config: null },
        ],
      },
    });
    const result = await new SubscriptionService(prisma).getMarketingCapabilities(7);

    expect(result.enabled).toBe(true);
    expect(result.allowedCampaignTypes).toEqual(['FLAT']);
  });

  it('returns disabled capabilities for expired, suspended, or mismatched subscriptions', async () => {
    const store = {
      id: 7,
      brand_id: 10,
      saas_package: {
        id: 3,
        code: 'POS_MARKETING',
        name: 'POS + Marketing',
        status: 'ACTIVE',
        modules: [{ module_key: 'MARKETING' }],
      },
    };

    for (const subscription of [
      { ...activeSubscription, status: 'SUSPENDED' },
      { ...activeSubscription, expiry_date: new Date(Date.now() - 86400000) },
      { ...activeSubscription, package_id: 99 },
    ]) {
      const result = await new SubscriptionService(makePrisma(store, subscription)).getMarketingCapabilities(7);
      expect(result.enabled).toBe(false);
    }
  });
});
