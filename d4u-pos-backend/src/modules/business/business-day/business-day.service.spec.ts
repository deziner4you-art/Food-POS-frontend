import { BusinessDayService } from './business-day.service';

describe('BusinessDayService accounting', () => {
  it('reports realized sales separately from open order records and cash movements', async () => {
    const prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue([
          { total_amount: 100, payment_method: 'CASH', payment_status: 'PENDING', status: 'PENDING', order_source: 'POS' },
          { total_amount: 200, payment_method: 'CASH', payment_status: 'PAID', status: 'COMPLETED', order_source: 'POS' },
          { total_amount: 300, payment_method: 'COD', payment_status: 'UNPAID', status: 'READY', order_source: 'ONLINE' },
          { total_amount: 400, payment_method: 'CARD', payment_status: 'PAID', status: 'SETTLED', order_source: 'ONLINE' },
          { total_amount: 999, payment_method: 'CASH', payment_status: 'PAID', status: 'VOIDED', order_source: 'POS' },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
      cashFlow: {
        findMany: jest.fn().mockResolvedValue([
          { type: 'OPENING_FLOAT', comment: 'Opening Float', amount: 5000 },
          { type: 'CASH_IN', comment: 'Online Order #28 Cash Settlement', amount: 1200 },
          { type: 'CASH_OUT', comment: 'Petty cash', amount: 300 },
        ]),
      },
    };
    const service = new BusinessDayService(prisma as any);

    const result = await (service as any).calculateDayAccounting({ store_id: 1, id: 7, openingFloat: 5000 });

    expect(result.totalSales).toBe(600);
    expect(result.totalOrders).toBe(4);
    expect(result.settledOrders).toBe(2);
    expect(result.cashSales).toBe(200);
    expect(result.cardSales).toBe(400);
    expect(result.onlineSales).toBe(400);
    expect(result.cashIn).toBe(6200);
    expect(result.openingCashIn).toBe(5000);
    expect(result.cashOut).toBe(300);
    expect(result.expectedCash).toBe(5900);
  });
});
