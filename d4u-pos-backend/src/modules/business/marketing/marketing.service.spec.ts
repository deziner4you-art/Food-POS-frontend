import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { PricingService } from '../pos-orders/pricing.service';
import { SubscriptionService } from '../../core/subscription/subscription.service';
import { CampaignResolverService } from '../pos-orders/campaign-resolver.service';

describe('MarketingService', () => {
  let service: MarketingService;
  let prisma: any;
  let gateway: any;
  let subscriptions: any;

  // Two stores in the same brand (A1, A2), one store in a different brand (B).
  const STORE_A1 = { id: 67, brand_id: 1 };
  const STORE_A2 = { id: 70, brand_id: 1 };
  const STORE_B = { id: 68, brand_id: 2 };
  const USER_A = { sub: 88, active_brand_id: 1 };

  const CAMPAIGN_A = {
    id: 500,
    brand_id: 1,
    campaign_type: 'PERCENTAGE_DISCOUNT',
    title: 'Campaign A',
    target_categories: [],
    target_products: [],
    bundle_products: [],
  };

  beforeEach(async () => {
    prisma = {
      store: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      marketingCampaign: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      campaignAuditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    gateway = { server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }), emit: jest.fn() } };
    subscriptions = {
      getMarketingCapabilities: jest.fn().mockResolvedValue({
        enabled: true,
        allowedCampaignTypes: ['PERCENTAGE_DISCOUNT'],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: gateway },
        { provide: PricingService, useValue: {} },
        { provide: SubscriptionService, useValue: subscriptions },
        { provide: CampaignResolverService, useValue: {} },
      ],
    }).compile();

    service = module.get<MarketingService>(MarketingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Task #2R-F2a: brand-boundary tenant isolation for getCampaigns /
  // exportCampaignsJson / exportCampaignsCsv / cloneCampaign. #2R-F2-D
  // established the intended semantics for each (resolveBrandStoreScope for
  // the reads/exports; source-campaign-brand-scoped 'ALL' for cloning) --
  // this suite verifies the actual Prisma query shapes, not just outcomes.
  describe('getCampaigns — brand-boundary tenant isolation (Task #2R-F2a)', () => {
    it('1. own-brand store_id -> allowed, scoped to caller brand + preserves the existing target_stores OR clause', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.marketingCampaign.findMany.mockResolvedValue([CAMPAIGN_A]);

      const result = await service.getCampaigns(STORE_A1.id, false, USER_A);

      expect(result).toEqual([CAMPAIGN_A]);
      expect(prisma.store.findUnique).toHaveBeenCalledWith({ where: { id: STORE_A1.id }, select: { brand_id: true } });
      expect(prisma.marketingCampaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deleted_at: null,
            brand_id: 1,
            OR: [
              { target_stores: { none: {} } },
              { target_stores: { some: { id: STORE_A1.id } } },
            ],
          },
        }),
      );
    });

    it('2. cross-brand store_id -> rejected, no campaign query attempted', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(service.getCampaigns(STORE_B.id, false, USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.marketingCampaign.findMany).not.toHaveBeenCalled();
    });

    it('3. omitted store_id -> caller\'s own brand only, never a global/unfiltered query', async () => {
      prisma.store.findMany.mockResolvedValue([STORE_A1, STORE_A2]);
      prisma.marketingCampaign.findMany.mockResolvedValue([CAMPAIGN_A]);

      await service.getCampaigns(undefined, false, USER_A);

      expect(prisma.marketingCampaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deleted_at: null, brand_id: 1 } }),
      );
      const actualWhere = prisma.marketingCampaign.findMany.mock.calls[0][0].where;
      expect(actualWhere.brand_id).toBe(1);
      expect(actualWhere.OR).toBeUndefined();
    });

    it('rejects when there is no usable authenticated brand context, no query attempted', async () => {
      await expect(service.getCampaigns(undefined, false, undefined)).rejects.toThrow(BadRequestException);
      await expect(service.getCampaigns(undefined, false, {})).rejects.toThrow(BadRequestException);
      expect(prisma.marketingCampaign.findMany).not.toHaveBeenCalled();
    });
  });

  describe('exportCampaignsJson / exportCampaignsCsv — brand-boundary tenant isolation (Task #2R-F2a)', () => {
    it('own-brand store_id -> allowed, scoped to caller brand', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_A1);
      prisma.marketingCampaign.findMany.mockResolvedValue([CAMPAIGN_A]);

      await service.exportCampaignsJson(STORE_A1.id, USER_A);

      expect(prisma.marketingCampaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deleted_at: null,
            brand_id: 1,
            OR: [
              { target_stores: { none: {} } },
              { target_stores: { some: { id: STORE_A1.id } } },
            ],
          },
        }),
      );
    });

    it('4. exportCampaignsJson: cross-brand store_id -> rejected, no query attempted', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(service.exportCampaignsJson(STORE_B.id, USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.marketingCampaign.findMany).not.toHaveBeenCalled();
    });

    it('5. exportCampaignsCsv: cross-brand store_id -> rejected (inherits exportCampaignsJson\'s rejection)', async () => {
      prisma.store.findUnique.mockResolvedValue(STORE_B);

      await expect(service.exportCampaignsCsv(STORE_B.id, USER_A)).rejects.toThrow(BadRequestException);
      expect(prisma.marketingCampaign.findMany).not.toHaveBeenCalled();
    });

    it('6. exportCampaignsJson: omitted store_id -> own brand only, never a cross-brand dump', async () => {
      prisma.store.findMany.mockResolvedValue([STORE_A1, STORE_A2]);
      prisma.marketingCampaign.findMany.mockResolvedValue([]);

      await service.exportCampaignsJson(undefined, USER_A);

      const actualWhere = prisma.marketingCampaign.findMany.mock.calls[0][0].where;
      expect(actualWhere).toEqual({ deleted_at: null, brand_id: 1 });
    });
  });

  describe('cloneCampaign — brand-boundary tenant isolation (Task #2R-F2a)', () => {
    it('7. explicit same-brand target stores -> allowed', async () => {
      prisma.marketingCampaign.findUnique.mockResolvedValue(CAMPAIGN_A);
      prisma.store.count.mockResolvedValue(2);
      prisma.marketingCampaign.create.mockResolvedValue({ id: 999, target_stores: [STORE_A1, STORE_A2] });

      await service.cloneCampaign(CAMPAIGN_A.id, [STORE_A1.id, STORE_A2.id], {});

      expect(prisma.store.count).toHaveBeenCalledWith({
        where: { id: { in: [STORE_A1.id, STORE_A2.id] }, brand_id: CAMPAIGN_A.brand_id },
      });
      expect(prisma.marketingCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            brand_id: CAMPAIGN_A.brand_id,
            target_stores: { connect: [{ id: STORE_A1.id }, { id: STORE_A2.id }] },
          }),
        }),
      );
    });

    it('8. explicit target store belonging to another brand -> rejected, no clone created', async () => {
      prisma.marketingCampaign.findUnique.mockResolvedValue(CAMPAIGN_A);
      prisma.store.count.mockResolvedValue(1); // only 1 of the 2 requested ids actually belongs to this brand

      await expect(
        service.cloneCampaign(CAMPAIGN_A.id, [STORE_A1.id, STORE_B.id], {}),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.marketingCampaign.create).not.toHaveBeenCalled();
    });

    it("9. 'ALL' resolves only to the source campaign's own brand stores", async () => {
      prisma.marketingCampaign.findUnique.mockResolvedValue(CAMPAIGN_A);
      prisma.store.findMany.mockResolvedValue([STORE_A1, STORE_A2]);
      prisma.marketingCampaign.create.mockResolvedValue({ id: 999, target_stores: [STORE_A1, STORE_A2] });

      await service.cloneCampaign(CAMPAIGN_A.id, 'ALL', {});

      expect(prisma.store.findMany).toHaveBeenCalledWith({
        where: { brand_id: CAMPAIGN_A.brand_id, deleted_at: null },
        select: { id: true },
      });
      expect(prisma.marketingCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            brand_id: CAMPAIGN_A.brand_id,
            target_stores: { connect: [{ id: STORE_A1.id }, { id: STORE_A2.id }] },
          }),
        }),
      );
    });

    it("10. 'ALL' provably excludes another brand's stores -- the store query itself is brand-scoped, never platform-wide", async () => {
      prisma.marketingCampaign.findUnique.mockResolvedValue(CAMPAIGN_A);
      prisma.store.findMany.mockResolvedValue([STORE_A1, STORE_A2]);
      prisma.marketingCampaign.create.mockResolvedValue({ id: 999, target_stores: [STORE_A1, STORE_A2] });

      await service.cloneCampaign(CAMPAIGN_A.id, 'ALL', {});

      const actualWhere = prisma.store.findMany.mock.calls[0][0].where;
      expect(actualWhere).not.toEqual({ deleted_at: null }); // the old, platform-wide shape
      expect(actualWhere.brand_id).toBe(CAMPAIGN_A.brand_id);
    });

    it('12. campaign-not-found still rejects exactly as before -- unrelated behavior unchanged', async () => {
      prisma.marketingCampaign.findUnique.mockResolvedValue(null);

      await expect(service.cloneCampaign(9999, 'ALL', {})).rejects.toThrow(BadRequestException);
      expect(prisma.store.findMany).not.toHaveBeenCalled();
      expect(prisma.marketingCampaign.create).not.toHaveBeenCalled();
    });
  });
});
