import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { EntitlementService } from './entitlement.service';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let subscriptionService: any;

  beforeEach(async () => {
    subscriptionService = {
      getPackages: jest.fn(),
      createPackage: jest.fn(),
      updatePackage: jest.fn(),
      archivePackage: jest.fn(),
      getPricing: jest.fn(),
      saveBulkPricing: jest.fn().mockResolvedValue([]),
      updatePricing: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        { provide: SubscriptionService, useValue: subscriptionService },
        { provide: EntitlementService, useValue: {} },
      ],
    }).compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates saveBulkPricing to subscriptionService', async () => {
    const payload = { currency: 'PKR', items: [{ module_key: 'BASE_POS', price_monthly: 3000 }] };
    await controller.saveBulkPricing(payload);
    expect(subscriptionService.saveBulkPricing).toHaveBeenCalledWith('PKR', payload.items);
  });
});
