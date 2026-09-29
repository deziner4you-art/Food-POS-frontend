import { CampaignResolverService } from './campaign-resolver.service';

describe('CampaignResolverService — marketing entitlement boundary', () => {
  it('does not return active campaigns to a store without MARKETING', async () => {
    const prisma = {
      store: { findUnique: jest.fn() },
      marketingCampaign: { findMany: jest.fn() },
    } as any;
    const subscriptions = {
      getMarketingCapabilities: jest.fn().mockResolvedValue({
        enabled: false,
        allowedCampaignTypes: [],
        socialPublishing: false,
        tvBoard: false,
        analytics: false,
      }),
    };
    const service = new CampaignResolverService(prisma, subscriptions as any);

    await expect(service.getCoreActiveCampaigns(7)).resolves.toEqual([]);
    await expect(service.resolveVisibleCampaigns({ store_id: 7, channel: 'pos' })).resolves.toEqual([]);
    expect(prisma.marketingCampaign.findMany).not.toHaveBeenCalled();
  });

  it('does not return TV campaigns when the tenant lacks TV capability', async () => {
    const prisma = {
      store: { findUnique: jest.fn().mockResolvedValue({ brand_id: 10 }) },
      marketingCampaign: { findMany: jest.fn() },
    } as any;
    const subscriptions = {
      getMarketingCapabilities: jest.fn().mockResolvedValue({
        enabled: true,
        allowedCampaignTypes: ['FLAT'],
        socialPublishing: false,
        tvBoard: false,
        analytics: false,
      }),
    };
    const service = new CampaignResolverService(prisma, subscriptions as any);

    await expect(service.resolveVisibleCampaigns({ store_id: 7, channel: 'tv' })).resolves.toEqual([]);
    expect(prisma.marketingCampaign.findMany).not.toHaveBeenCalled();
  });

  it('fails closed when a public campaign request has no store identity', async () => {
    const prisma = {
      store: { findUnique: jest.fn() },
      marketingCampaign: { findMany: jest.fn() },
    } as any;
    const subscriptions = { getMarketingCapabilities: jest.fn() };
    const service = new CampaignResolverService(prisma, subscriptions as any);

    await expect(service.resolveVisibleCampaigns({ channel: 'web' })).resolves.toEqual([]);
    expect(subscriptions.getMarketingCapabilities).not.toHaveBeenCalled();
    expect(prisma.marketingCampaign.findMany).not.toHaveBeenCalled();
  });
});
