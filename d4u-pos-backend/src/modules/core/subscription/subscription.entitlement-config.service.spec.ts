import { BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService package configuration safety', () => {
  it('rejects an empty package instead of deleting all existing modules', async () => {
    const prisma: any = {
      packageModule: { deleteMany: jest.fn() },
    };
    const service = new SubscriptionService(prisma);

    await expect(service.updatePackage(1, {
      name: 'Broken Package',
      currency: 'USD',
      monthly_rental: 50,
      billing_cycle: 'MONTHLY',
      modules: [],
    })).rejects.toThrow(BadRequestException);
    expect(prisma.packageModule.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects KDS without BASE_POS and unknown module keys', async () => {
    const service = new SubscriptionService({} as any);

    await expect(service.createPackage({
      name: 'KDS only',
      currency: 'USD',
      monthly_rental: 50,
      billing_cycle: 'MONTHLY',
      modules: [{ module_key: 'KDS', price: 0 }],
    })).rejects.toThrow('BASE_POS');

    await expect(service.createPackage({
      name: 'Unknown',
      currency: 'USD',
      monthly_rental: 50,
      billing_cycle: 'MONTHLY',
      modules: [{ module_key: 'BASE_POS', price: 0 }, { module_key: 'NOT_REAL', price: 0 }],
    })).rejects.toThrow('Unknown package module');
  });

  it('returns registry defaults without writing when pricing rows are empty', async () => {
    const prisma: any = {
      saaSPricing: { findMany: jest.fn().mockResolvedValue([]), createMany: jest.fn() },
    };
    const result = await new SubscriptionService(prisma).getPricing('USD');

    expect(result.some((row: any) => row.module_key === 'BASE_POS')).toBe(true);
    expect(result.some((row: any) => row.module_key === 'KDS')).toBe(true);
    expect(result.every((row: any) => row.persisted === false)).toBe(true);
    expect(prisma.saaSPricing.createMany).not.toHaveBeenCalled();
  });

  it('fails safely to registry defaults when pricing storage is unavailable', async () => {
    const prisma: any = {
      saaSPricing: { findMany: jest.fn().mockRejectedValue(new Error('table missing')) },
    };
    const result = await new SubscriptionService(prisma).getPricing('USD');

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].persisted).toBe(false);
  });
});
