import { ReportsController } from './reports.controller';

describe('ReportsController tenant boundaries', () => {
  const user = { sub: 'terminal-session', role: 'Cashier', active_store_id: 7, active_brand_id: 10 };
  const prisma = {
    store: { findUnique: jest.fn() },
    brand: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  const service = {
    getDailyReport: jest.fn(),
    getBranchAnalytics: jest.fn(),
    getShifts: jest.fn(),
    getWeeklyTrend: jest.fn(),
    getTopProducts: jest.fn(),
    getVoidedOrders: jest.fn(),
    getBrandOverview: jest.fn(),
  };
  let controller: ReportsController;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.store.findUnique.mockImplementation(({ where }: any) => Promise.resolve({ id: where.id, brand_id: 10 }));
    prisma.brand.findUnique.mockImplementation(({ where }: any) => Promise.resolve({ id: where.id }));
    prisma.user.findUnique.mockResolvedValue(null);
    controller = new ReportsController(service as any, prisma as any);
  });

  it('allows a report for the active store and forwards the authenticated context', async () => {
    service.getDailyReport.mockResolvedValue({ totalSales: 12 });
    await expect(controller.getDailyReport('7', undefined, { user })).resolves.toEqual({ totalSales: 12 });
    expect(service.getDailyReport).toHaveBeenCalledWith(7, undefined, user);
  });

  it('rejects a cross-store report before invoking the report service', async () => {
    await expect(controller.getWeeklyTrend('99', { user })).rejects.toThrow('You do not have access to this store');
    expect(service.getWeeklyTrend).not.toHaveBeenCalled();
  });

  it('rejects a cross-brand overview before invoking the report service', async () => {
    await expect(controller.getBrandOverview('99', { user })).rejects.toThrow('You do not have access to this brand');
    expect(service.getBrandOverview).not.toHaveBeenCalled();
  });

  it('rejects missing or invalid report tenant identifiers', async () => {
    await expect(controller.getDailyReport('', undefined, { user })).rejects.toThrow('A valid store is required');
    await expect(controller.getBrandOverview('0', { user })).rejects.toThrow('A valid brand is required');
  });
});
