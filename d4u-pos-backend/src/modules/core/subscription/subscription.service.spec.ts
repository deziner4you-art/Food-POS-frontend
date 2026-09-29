import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      saaSPricing: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockImplementation((args) => Promise.resolve({ id: 10, ...args.create })),
        update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, price_monthly: args.data.price_monthly })),
      },
      $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveBulkPricing', () => {
    it('rejects missing or empty currency', async () => {
      await expect(service.saveBulkPricing('', [{ module_key: 'BASE_POS', price_monthly: 100 }]))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects empty items array', async () => {
      await expect(service.saveBulkPricing('PKR', []))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects invalid or unknown module key', async () => {
      await expect(service.saveBulkPricing('PKR', [{ module_key: 'INVALID_MODULE', price_monthly: 100 }]))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects negative prices', async () => {
      await expect(service.saveBulkPricing('PKR', [{ module_key: 'BASE_POS', price_monthly: -50 }]))
        .rejects.toThrow(BadRequestException);
    });

    it('saves bulk pricing and calls upsert via $transaction', async () => {
      const items = [
        { module_key: 'BASE_POS', price_monthly: 3000 },
        { module_key: 'VENDORS', price_monthly: 2000 },
      ];

      await service.saveBulkPricing('PKR', items);

      expect(prisma.saaSPricing.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('updatePricing', () => {
    it('updates by existing numeric id', async () => {
      const res = await service.updatePricing(5, { price_monthly: 2500 });
      expect(prisma.saaSPricing.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { price_monthly: 2500 },
      });
      expect(res.price_monthly).toBe(2500);
    });

    it('upserts by module_key when id is not a positive integer', async () => {
      await service.updatePricing(0, { module_key: 'BASE_POS', currency: 'PKR', price_monthly: 3000 });
      expect(prisma.saaSPricing.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          module_key_currency: {
            module_key: 'BASE_POS',
            currency: 'PKR',
          },
        },
      }));
    });
  });
});
