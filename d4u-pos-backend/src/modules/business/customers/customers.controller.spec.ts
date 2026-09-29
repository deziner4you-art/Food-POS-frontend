import { CustomersController } from './customers.controller';

describe('CustomersController tenant boundaries', () => {
  const user = { sub: 'terminal-session', role: 'Cashier', active_store_id: 7, active_brand_id: 10 };
  const prisma = {
    store: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  const service = {
    getCustomers: jest.fn(),
    getCustomerForTenant: jest.fn(),
    getWalletBalance: jest.fn(),
    createCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    earnPoints: jest.fn(),
    redeemPoints: jest.fn(),
    deleteCustomer: jest.fn(),
  };
  let controller: CustomersController;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.store.findUnique.mockImplementation(({ where }: any) => Promise.resolve({ id: where.id, brand_id: 10 }));
    prisma.user.findUnique.mockResolvedValue(null);
    service.getCustomerForTenant.mockResolvedValue({ customer: { id: 5, brand_id: 10 }, store: { id: 7, brand_id: 10 } });
    controller = new CustomersController(service as any, prisma as any);
  });

  it('rejects a customer list for another store before calling the service', async () => {
    await expect(controller.getCustomers(user, '99', 'Ali')).rejects.toThrow('You do not have access to this store');
    expect(service.getCustomers).not.toHaveBeenCalled();
  });

  it('allows a same-store customer list and forwards the authenticated user', async () => {
    service.getCustomers.mockResolvedValue([]);
    await expect(controller.getCustomers(user, '7', 'Ali')).resolves.toEqual([]);
    expect(service.getCustomers).toHaveBeenCalledWith(user, 7, 'Ali');
  });

  it('server-authorizes customer ownership before wallet access', async () => {
    service.getWalletBalance.mockResolvedValue({ id: 5, transactions: [] });
    await expect(controller.getWallet(user, '5')).resolves.toEqual({ id: 5, transactions: [] });
    expect(service.getCustomerForTenant).toHaveBeenCalledWith(5, user);
  });

  it('does not call update/delete/loyalty operations for a cross-tenant customer', async () => {
    service.getCustomerForTenant.mockRejectedValue(new Error('Customer not found'));
    await expect(controller.updateCustomer(user, '5', { name: 'X' } as any)).rejects.toThrow('Customer not found');
    await expect(controller.deleteCustomer(user, '5')).rejects.toThrow('Customer not found');
    await expect(controller.redeemPoints(user, '5', { points: 1 })).rejects.toThrow('Customer not found');
    expect(service.updateCustomer).not.toHaveBeenCalled();
    expect(service.deleteCustomer).not.toHaveBeenCalled();
    expect(service.redeemPoints).not.toHaveBeenCalled();
  });

  it('uses the authenticated store when awarding points', async () => {
    service.earnPoints.mockResolvedValue({ success: true, points: 2 });
    await expect(controller.earnPoints(user, '5', { order_id: 12, order_amount: 100 })).resolves.toEqual({ success: true, points: 2 });
    expect(service.earnPoints).toHaveBeenCalledWith(5, 12, 100, 7);
  });

  it('passes the authenticated user into customer creation', async () => {
    service.createCustomer.mockResolvedValue({ success: true });
    const body = { brand_id: 999, phone: '923000000001', name: 'Customer' } as any;
    await expect(controller.createCustomer(user, body)).resolves.toEqual({ success: true });
    expect(service.createCustomer).toHaveBeenCalledWith(body, user);
  });
});
