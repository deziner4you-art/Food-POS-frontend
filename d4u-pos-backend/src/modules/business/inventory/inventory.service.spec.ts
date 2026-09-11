import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: any;

  const ITEM_OWN_1 = { id: 1, store_id: 67 };
  const ITEM_OWN_2 = { id: 2, store_id: 67 };
  const ITEM_FOREIGN = { id: 3, store_id: 99 };

  beforeEach(async () => {
    prisma = {
      inventoryItem: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      inventoryTransactionLog: { create: jest.fn() },
    };
    prisma.$transaction = jest.fn((cb: any) => cb(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppGateway, useValue: { server: { emit: jest.fn() } } },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Task #2R-G1b1: syncOfflineTransactions previously accepted a store_id
  // parameter but never used it to scope any transaction's inventory_id --
  // every entry was trusted and mutated regardless of which store it
  // actually belonged to. Every item is now loaded and checked in one
  // batched query before the mutating $transaction ever starts.
  describe('syncOfflineTransactions — inventory_id ownership IDOR fix (Task #2R-G1b1)', () => {
    it('same-store batch -> allowed, every transaction processed', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([ITEM_OWN_1, ITEM_OWN_2]);

      const result = await service.syncOfflineTransactions(67, [
        { inventory_id: 1, operation: 'ADD', amount: 5 },
        { inventory_id: 2, operation: 'SUBTRACT', amount: 2 },
      ]);

      expect(result).toEqual({ status: 'success', synced: 2 });
      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        select: { id: true, store_id: true },
      });
      expect(prisma.inventoryTransactionLog.create).toHaveBeenCalledTimes(2);
      expect(prisma.inventoryItem.update).toHaveBeenCalledTimes(2);
    });

    it('single foreign-store transaction -> rejected, zero mutation', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([ITEM_FOREIGN]);

      await expect(
        service.syncOfflineTransactions(67, [{ inventory_id: 3, operation: 'ADD', amount: 1 }]),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.inventoryTransactionLog.create).not.toHaveBeenCalled();
      expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
    });

    it('mixed batch (own store first, foreign second) -> rejected in full, zero mutation', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([ITEM_OWN_1, ITEM_FOREIGN]);

      await expect(
        service.syncOfflineTransactions(67, [
          { inventory_id: 1, operation: 'ADD', amount: 1 },
          { inventory_id: 3, operation: 'ADD', amount: 1 },
        ]),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
    });

    it('mixed batch (foreign store first, own second) -> rejected in full, zero mutation -- proves the fix does not merely check the first entry', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([ITEM_FOREIGN, ITEM_OWN_1]);

      await expect(
        service.syncOfflineTransactions(67, [
          { inventory_id: 3, operation: 'ADD', amount: 1 },
          { inventory_id: 1, operation: 'ADD', amount: 1 },
        ]),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
    });

    it('nonexistent inventory_id -> rejected safely, zero mutation', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([]);

      await expect(
        service.syncOfflineTransactions(67, [{ inventory_id: 999, operation: 'ADD', amount: 1 }]),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('empty batch -> no items to validate, still succeeds with zero synced', async () => {
      const result = await service.syncOfflineTransactions(67, []);
      expect(result).toEqual({ status: 'success', synced: 0 });
      expect(prisma.inventoryItem.findMany).not.toHaveBeenCalled();
    });
  });

  // Task #2R-G1b1: recordPurchase previously accepted a store_id parameter
  // but never used it to scope the inventory_id lookup at all -- a caller
  // could record a purchase against any store's item regardless of the
  // declared store_id.
  describe('recordPurchase — inventory_id ownership IDOR fix (Task #2R-G1b1)', () => {
    it('A. own-store inventory_id -> succeeds', async () => {
      prisma.inventoryItem.findUnique.mockResolvedValue({ id: 1, store_id: 67, quantity: 10, unit_price: 5 });
      prisma.inventoryItem.update.mockResolvedValue({ id: 1, store_id: 67, quantity: 15, unit_price: 6 });

      const result = await service.recordPurchase(67, 1, 5, 25);

      expect(result.success).toBe(true);
      expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('B. foreign-store inventory_id -> rejected', async () => {
      prisma.inventoryItem.findUnique.mockResolvedValue({ id: 1, store_id: 99, quantity: 10, unit_price: 5 });

      await expect(service.recordPurchase(67, 1, 5, 25)).rejects.toThrow(ForbiddenException);
    });

    it('C. service mutation is not performed after a store mismatch', async () => {
      prisma.inventoryItem.findUnique.mockResolvedValue({ id: 1, store_id: 99, quantity: 10, unit_price: 5 });

      await expect(service.recordPurchase(67, 1, 5, 25)).rejects.toThrow(ForbiddenException);
      expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
      expect(prisma.inventoryTransactionLog.create).not.toHaveBeenCalled();
    });

    it('nonexistent inventory_id -> still throws the pre-existing not-found error, unchanged', async () => {
      prisma.inventoryItem.findUnique.mockResolvedValue(null);

      await expect(service.recordPurchase(67, 999, 5, 25)).rejects.toThrow('Inventory item not found');
      expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
    });
  });
});
