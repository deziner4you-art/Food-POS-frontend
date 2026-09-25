import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateBackupKots, restoreBackupData } from './backupRestore';

describe('Task #3C-3: Admin Backup Restore — KOT Identity Safety', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      kots: {
        clear: vi.fn().mockResolvedValue(undefined),
        bulkAdd: vi.fn().mockResolvedValue(undefined),
      },
      inventory: {
        clear: vi.fn().mockResolvedValue(undefined),
        bulkAdd: vi.fn().mockResolvedValue(undefined),
      },
      crmCustomers: {
        clear: vi.fn().mockResolvedValue(undefined),
        bulkAdd: vi.fn().mockResolvedValue(undefined),
      },
      staffLogs: {
        clear: vi.fn().mockResolvedValue(undefined),
        bulkAdd: vi.fn().mockResolvedValue(undefined),
      },
      transaction: vi.fn().mockImplementation(async (_mode, ...args) => {
        const callback = args[args.length - 1];
        return await callback();
      }),
    };
  });

  const validKot1 = {
    id: 10,
    orderId: 1001,
    order_id: 1001,
    store_id: 2,
    businessDayId: 5,
    status: 'READY',
    backendKotId: 501,
    items: '1x Burger',
    notes: 'No onions',
  };

  const validKot2 = {
    id: 11,
    orderId: 1002,
    order_id: 1002,
    store_id: 3,
    businessDayId: 7,
    status: 'NEW',
    backendKotId: 502,
    items: '2x Soda',
  };

  it('A: Backup with all valid KOT identities -> restore succeeds and identities remain unchanged', async () => {
    const backupData = {
      kots: [validKot1, validKot2],
    };

    await restoreBackupData(backupData, mockDb);

    expect(mockDb.kots.clear).toHaveBeenCalledTimes(1);
    expect(mockDb.kots.bulkAdd).toHaveBeenCalledTimes(1);
    expect(mockDb.kots.bulkAdd).toHaveBeenCalledWith([validKot1, validKot2]);
  });

  it('B: One KOT missing store_id -> restore rejected BEFORE db.kots.clear/bulkAdd', async () => {
    const badKot = { ...validKot1 };
    delete (badKot as any).store_id;

    const backupData = { kots: [badKot] };

    await expect(restoreBackupData(backupData, mockDb)).rejects.toThrow(
      /missing or invalid store_id/
    );

    expect(mockDb.kots.clear).not.toHaveBeenCalled();
    expect(mockDb.kots.bulkAdd).not.toHaveBeenCalled();
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('C: One KOT missing businessDayId -> restore rejected BEFORE db.kots.clear/bulkAdd', async () => {
    const badKot = { ...validKot1 };
    delete (badKot as any).businessDayId;

    const backupData = { kots: [badKot] };

    await expect(restoreBackupData(backupData, mockDb)).rejects.toThrow(
      /missing or invalid businessDayId/
    );

    expect(mockDb.kots.clear).not.toHaveBeenCalled();
    expect(mockDb.kots.bulkAdd).not.toHaveBeenCalled();
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('D: store_id = 0 -> rejected BEFORE db.kots.clear', async () => {
    const backupData = {
      kots: [{ ...validKot1, store_id: 0 }],
    };

    await expect(restoreBackupData(backupData, mockDb)).rejects.toThrow(
      /missing or invalid store_id/
    );

    expect(mockDb.kots.clear).not.toHaveBeenCalled();
    expect(mockDb.kots.bulkAdd).not.toHaveBeenCalled();
  });

  it('E: businessDayId = 0 -> rejected BEFORE db.kots.clear', async () => {
    const backupData = {
      kots: [{ ...validKot1, businessDayId: 0 }],
    };

    await expect(restoreBackupData(backupData, mockDb)).rejects.toThrow(
      /missing or invalid businessDayId/
    );

    expect(mockDb.kots.clear).not.toHaveBeenCalled();
    expect(mockDb.kots.bulkAdd).not.toHaveBeenCalled();
  });

  it('F: fractional store_id -> rejected BEFORE db.kots.clear', async () => {
    const backupData = {
      kots: [{ ...validKot1, store_id: 2.5 }],
    };

    await expect(restoreBackupData(backupData, mockDb)).rejects.toThrow(
      /missing or invalid store_id/
    );

    expect(mockDb.kots.clear).not.toHaveBeenCalled();
    expect(mockDb.kots.bulkAdd).not.toHaveBeenCalled();
  });

  it('G: fractional businessDayId -> rejected BEFORE db.kots.clear', async () => {
    const backupData = {
      kots: [{ ...validKot1, businessDayId: 5.75 }],
    };

    await expect(restoreBackupData(backupData, mockDb)).rejects.toThrow(
      /missing or invalid businessDayId/
    );

    expect(mockDb.kots.clear).not.toHaveBeenCalled();
    expect(mockDb.kots.bulkAdd).not.toHaveBeenCalled();
  });

  it('H: NaN / Infinity -> rejected BEFORE db.kots.clear', async () => {
    // Case 1: NaN store_id
    await expect(
      restoreBackupData({ kots: [{ ...validKot1, store_id: NaN }] }, mockDb)
    ).rejects.toThrow(/missing or invalid store_id/);

    // Case 2: Infinity store_id
    await expect(
      restoreBackupData({ kots: [{ ...validKot1, store_id: Infinity }] }, mockDb)
    ).rejects.toThrow(/missing or invalid store_id/);

    // Case 3: Infinity businessDayId
    await expect(
      restoreBackupData({ kots: [{ ...validKot1, businessDayId: Infinity }] }, mockDb)
    ).rejects.toThrow(/missing or invalid businessDayId/);

    expect(mockDb.kots.clear).not.toHaveBeenCalled();
    expect(mockDb.kots.bulkAdd).not.toHaveBeenCalled();
  });

  it('I: string / boolean / object / array IDs -> rejected BEFORE db.kots.clear', async () => {
    // string store_id
    await expect(
      restoreBackupData({ kots: [{ ...validKot1, store_id: '2' }] }, mockDb)
    ).rejects.toThrow(/missing or invalid store_id/);

    // boolean businessDayId
    await expect(
      restoreBackupData({ kots: [{ ...validKot1, businessDayId: true }] }, mockDb)
    ).rejects.toThrow(/missing or invalid businessDayId/);

    // object store_id
    await expect(
      restoreBackupData({ kots: [{ ...validKot1, store_id: {} }] }, mockDb)
    ).rejects.toThrow(/missing or invalid store_id/);

    // array businessDayId
    await expect(
      restoreBackupData({ kots: [{ ...validKot1, businessDayId: [5] }] }, mockDb)
    ).rejects.toThrow(/missing or invalid businessDayId/);

    expect(mockDb.kots.clear).not.toHaveBeenCalled();
    expect(mockDb.kots.bulkAdd).not.toHaveBeenCalled();
  });

  it('J: Mixed backup (valid KOT + invalid KOT) -> entire restore rejected before any destructive write', async () => {
    const invalidKot = {
      id: 99,
      orderId: 9999,
      store_id: 1, // store_id is valid
      businessDayId: undefined, // businessDayId is missing!
    };

    const backupData = {
      kots: [validKot1, invalidKot, validKot2],
    };

    await expect(restoreBackupData(backupData, mockDb)).rejects.toThrow(
      /missing or invalid businessDayId/
    );

    // Ensure none of the valid KOTs were written and table was not cleared
    expect(mockDb.kots.clear).not.toHaveBeenCalled();
    expect(mockDb.kots.bulkAdd).not.toHaveBeenCalled();
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('K: Existing valid KOT identity must NOT be rewritten to active Store or active BusinessDay', async () => {
    const customKot = {
      id: 77,
      orderId: 888,
      order_id: 888,
      store_id: 3,
      businessDayId: 19,
      status: 'COMPLETED',
      backendKotId: 999,
    };

    const backupData = { kots: [customKot] };
    await restoreBackupData(backupData, mockDb);

    expect(mockDb.kots.bulkAdd).toHaveBeenCalledTimes(1);
    const addedKots = mockDb.kots.bulkAdd.mock.calls[0][0];

    expect(addedKots[0].id).toBe(77);
    expect(addedKots[0].store_id).toBe(3); // Preserved exactly, NOT changed to store 1
    expect(addedKots[0].businessDayId).toBe(19); // Preserved exactly, NOT changed
    expect(addedKots[0].status).toBe('COMPLETED');
    expect(addedKots[0].backendKotId).toBe(999);
  });

  describe('Zero KOT backup records handling', () => {
    it('succeeds when kots is an empty array', async () => {
      const backupData = {
        kots: [],
        inventory: [{ id: 'ING1', currentStock: 10 }],
      };

      await restoreBackupData(backupData, mockDb);

      expect(mockDb.kots.clear).toHaveBeenCalledTimes(1);
      expect(mockDb.kots.bulkAdd).toHaveBeenCalledWith([]);
      expect(mockDb.inventory.clear).toHaveBeenCalledTimes(1);
      expect(mockDb.inventory.bulkAdd).toHaveBeenCalledWith(backupData.inventory);
    });

    it('succeeds when kots is omitted/undefined in backup data', async () => {
      const backupData = {
        inventory: [{ id: 'ING1', currentStock: 10 }],
      };

      await restoreBackupData(backupData, mockDb);

      expect(mockDb.kots.clear).not.toHaveBeenCalled();
      expect(mockDb.kots.bulkAdd).not.toHaveBeenCalled();
      expect(mockDb.inventory.clear).toHaveBeenCalledTimes(1);
      expect(mockDb.inventory.bulkAdd).toHaveBeenCalledWith(backupData.inventory);
    });
  });
});
