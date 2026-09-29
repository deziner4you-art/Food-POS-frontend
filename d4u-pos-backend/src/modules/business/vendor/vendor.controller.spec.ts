import { Test, TestingModule } from '@nestjs/testing';
import { VendorController } from './vendor.controller';

describe('VendorController', () => {
  let controller: VendorController;
  const user = { sub: 'terminal-session', role: 'Cashier', active_store_id: 7, active_brand_id: 10 };
  const prisma = {
    store: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  const vendorService = {
    getVendorById: jest.fn(),
    getPurchaseOrderById: jest.fn(),
    getGRNById: jest.fn(),
    getVendors: jest.fn(),
    createVendor: jest.fn(),
    updateVendor: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.store.findUnique.mockImplementation(({ where }: any) => Promise.resolve({ id: where.id, brand_id: 10 }));
    prisma.user.findUnique.mockResolvedValue(null);
    vendorService.getVendorById.mockResolvedValue({ id: 4, store_id: 7 });
    vendorService.getPurchaseOrderById.mockResolvedValue({ id: 8, store_id: 7 });
    vendorService.getGRNById.mockResolvedValue({ id: 9, store_id: 7, purchaseOrder: { store_id: 7 } });
    controller = new VendorController(vendorService as any, prisma as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('allows a vendor list only for the authenticated active store', async () => {
    vendorService.getVendors.mockResolvedValue([]);
    await expect(controller.getVendors(user, '7')).resolves.toEqual([]);
    expect(vendorService.getVendors).toHaveBeenCalledWith(7);
  });

  it('rejects a vendor list for another store before calling the service', async () => {
    await expect(controller.getVendors(user, '99')).rejects.toThrow('You do not have access to this store');
    expect(vendorService.getVendors).not.toHaveBeenCalled();
  });

  it('server-loads vendor ownership before entity reads', async () => {
    vendorService.getVendorById.mockResolvedValue({ id: 4, store_id: 99 });
    await expect(controller.getVendorById(user, '4')).rejects.toThrow('You do not have access to this store');
  });

  it('server-loads purchase-order ownership before entity reads', async () => {
    vendorService.getPurchaseOrderById.mockResolvedValue({ id: 8, store_id: 99 });
    await expect(controller.getPurchaseOrderById(user, '8')).rejects.toThrow('You do not have access to this store');
  });

  it('server-loads GRN ownership through its linked purchase order', async () => {
    vendorService.getGRNById.mockResolvedValue({ id: 9, store_id: 7, purchaseOrder: { store_id: 99 } });
    await expect(controller.getGRNById(user, '9')).rejects.toThrow('You do not have access to this store');
  });

  it('rejects create payloads for another store', async () => {
    await expect(controller.createVendor(user, { store_id: 99, name: 'Other tenant' })).rejects.toThrow(
      'You do not have access to this store',
    );
    expect(vendorService.createVendor).not.toHaveBeenCalled();
  });

  it('does not allow a vendor update to reassign the vendor to another store', async () => {
    vendorService.updateVendor.mockResolvedValue({ id: 4, store_id: 7 });
    await controller.updateVendor(user, '4', { name: 'Updated', store_id: 99 });
    expect(vendorService.updateVendor).toHaveBeenCalledWith(4, { name: 'Updated' });
  });
});
