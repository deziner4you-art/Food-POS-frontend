import { Test, TestingModule } from '@nestjs/testing';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';

describe('MarketingController', () => {
  let controller: MarketingController;
  let service: any;

  beforeEach(async () => {
    service = {
      getCampaigns: jest.fn(),
      getVisibleCampaigns: jest.fn(),
      exportCampaignsJson: jest.fn(),
      exportCampaignsCsv: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketingController],
      providers: [{ provide: MarketingService, useValue: service }],
    }).compile();

    controller = module.get<MarketingController>(MarketingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-F2a: confirms the controller wires @CurrentUser() through to
  // the service for every route touched by the brand-boundary fix -- the
  // security-relevant query-shape assertions live in marketing.service.spec.ts,
  // this just confirms the plumbing.
  describe('@CurrentUser() wiring (Task #2R-F2a)', () => {
    const AUTH_USER = { sub: 1, active_brand_id: 1 };

    it('getCampaigns passes authenticatedUser through when no channel is given', () => {
      controller.getCampaigns('67', undefined, undefined, AUTH_USER);
      expect(service.getCampaigns).toHaveBeenCalledWith(67, false, AUTH_USER);
    });

    it('getCampaigns does NOT call getCampaigns (delegates to getVisibleCampaigns instead) when channel is given', () => {
      controller.getCampaigns('67', 'pos' as any, undefined, AUTH_USER);
      expect(service.getVisibleCampaigns).toHaveBeenCalledWith(67, 'pos');
      expect(service.getCampaigns).not.toHaveBeenCalled();
    });

    it('exportJson passes authenticatedUser through', () => {
      controller.exportJson('67', AUTH_USER);
      expect(service.exportCampaignsJson).toHaveBeenCalledWith(67, AUTH_USER);
    });

    it('exportCsv passes authenticatedUser through', async () => {
      await controller.exportCsv('67', AUTH_USER);
      expect(service.exportCampaignsCsv).toHaveBeenCalledWith(67, AUTH_USER);
    });
  });
});
