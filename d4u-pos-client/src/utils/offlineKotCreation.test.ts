import { describe, it, expect, vi } from 'vitest';
import {
  createOfflineKot,
  validateOfflineKotIdentity,
  isValidPosIntegerId,
  OfflineKOT,
} from '../db';

describe('Task #3C-1: Offline KOT Creation Guard & Identity Validation', () => {
  const baseKotData: Partial<OfflineKOT> = {
    order_id: 1001,
    orderType: 'WALKIN',
    items: '2x Burger',
    notes: 'Extra sauce',
    timePlaced: '12:00 PM',
    status: 'NEW',
    totalAmount: 1500,
  };

  const createMockTable = () => ({
    add: vi.fn().mockImplementation(async (record: any) => 1),
  });

  describe('Strict positive integer ID validation (isValidPosIntegerId)', () => {
    it('accepts positive finite integers', () => {
      expect(isValidPosIntegerId(1)).toBe(true);
      expect(isValidPosIntegerId(2)).toBe(true);
      expect(isValidPosIntegerId(9999)).toBe(true);
    });

    it('rejects missing or non-number values', () => {
      expect(isValidPosIntegerId(undefined)).toBe(false);
      expect(isValidPosIntegerId(null)).toBe(false);
      expect(isValidPosIntegerId('1')).toBe(false);
      expect(isValidPosIntegerId({})).toBe(false);
      expect(isValidPosIntegerId([])).toBe(false);
      expect(isValidPosIntegerId(true)).toBe(false);
    });

    it('rejects 0 and negative integers', () => {
      expect(isValidPosIntegerId(0)).toBe(false);
      expect(isValidPosIntegerId(-1)).toBe(false);
      expect(isValidPosIntegerId(-100)).toBe(false);
    });

    it('rejects fractional numbers', () => {
      expect(isValidPosIntegerId(1.5)).toBe(false);
      expect(isValidPosIntegerId(0.1)).toBe(false);
      expect(isValidPosIntegerId(2.0001)).toBe(false);
    });

    it('rejects NaN and Infinities', () => {
      expect(isValidPosIntegerId(NaN)).toBe(false);
      expect(isValidPosIntegerId(Infinity)).toBe(false);
      expect(isValidPosIntegerId(-Infinity)).toBe(false);
    });
  });

  describe('Offline KOT Creation Identity Guard (createOfflineKot)', () => {
    it('1. valid store + valid business day -> KOT is created with both identities', async () => {
      const mockTable = createMockTable();
      const result = await createOfflineKot(baseKotData, 2, 10, mockTable);

      expect(mockTable.add).toHaveBeenCalledTimes(1);
      const persistedRecord = mockTable.add.mock.calls[0][0];
      expect(persistedRecord.store_id).toBe(2);
      expect(persistedRecord.businessDayId).toBe(10);
      expect(persistedRecord.synced).toBe(false);
      expect(persistedRecord.items).toBe('2x Burger');
      expect(persistedRecord.order_id).toBe(1001);
    });

    it('2. missing store (undefined/null) -> creation rejected, no Dexie write', async () => {
      const mockTableUndefined = createMockTable();
      await expect(
        createOfflineKot(baseKotData, undefined, 10, mockTableUndefined)
      ).rejects.toThrow(/Active Store identity is missing or invalid/);
      expect(mockTableUndefined.add).not.toHaveBeenCalled();

      const mockTableNull = createMockTable();
      await expect(
        createOfflineKot(baseKotData, null, 10, mockTableNull)
      ).rejects.toThrow(/Active Store identity is missing or invalid/);
      expect(mockTableNull.add).not.toHaveBeenCalled();
    });

    it('3. invalid store (0) -> rejected, no Dexie write', async () => {
      const mockTable = createMockTable();
      await expect(
        createOfflineKot(baseKotData, 0, 10, mockTable)
      ).rejects.toThrow(/Active Store identity is missing or invalid/);
      expect(mockTable.add).not.toHaveBeenCalled();
    });

    it('4. invalid store (fractional: 1.5, 2.2) -> rejected, no Dexie write', async () => {
      const mockTable = createMockTable();
      await expect(
        createOfflineKot(baseKotData, 1.5, 10, mockTable)
      ).rejects.toThrow(/Active Store identity is missing or invalid/);
      expect(mockTable.add).not.toHaveBeenCalled();

      await expect(
        createOfflineKot(baseKotData, 2.2, 10, mockTable)
      ).rejects.toThrow(/Active Store identity is missing or invalid/);
      expect(mockTable.add).not.toHaveBeenCalled();
    });

    it('5. missing business day (undefined/null) -> rejected, no Dexie write', async () => {
      const mockTableUndefined = createMockTable();
      await expect(
        createOfflineKot(baseKotData, 2, undefined, mockTableUndefined)
      ).rejects.toThrow(/Open Business Day identity is missing or invalid/);
      expect(mockTableUndefined.add).not.toHaveBeenCalled();

      const mockTableNull = createMockTable();
      await expect(
        createOfflineKot(baseKotData, 2, null, mockTableNull)
      ).rejects.toThrow(/Open Business Day identity is missing or invalid/);
      expect(mockTableNull.add).not.toHaveBeenCalled();
    });

    it('6. business day = 0 -> rejected, no Dexie write', async () => {
      const mockTable = createMockTable();
      await expect(
        createOfflineKot(baseKotData, 2, 0, mockTable)
      ).rejects.toThrow(/Open Business Day identity is missing or invalid/);
      expect(mockTable.add).not.toHaveBeenCalled();
    });

    it('7. business day fractional (10.5) -> rejected, no Dexie write', async () => {
      const mockTable = createMockTable();
      await expect(
        createOfflineKot(baseKotData, 2, 10.5, mockTable)
      ).rejects.toThrow(/Open Business Day identity is missing or invalid/);
      expect(mockTable.add).not.toHaveBeenCalled();
    });

    it('8. neither identity available -> rejected, no Dexie write', async () => {
      const mockTableUndefined = createMockTable();
      await expect(
        createOfflineKot(baseKotData, undefined, undefined, mockTableUndefined)
      ).rejects.toThrow(/Both Active Store and Open Business Day identities are missing or invalid/);
      expect(mockTableUndefined.add).not.toHaveBeenCalled();

      const mockTableNull = createMockTable();
      await expect(
        createOfflineKot(baseKotData, null, null, mockTableNull)
      ).rejects.toThrow(/Both Active Store and Open Business Day identities are missing or invalid/);
      expect(mockTableNull.add).not.toHaveBeenCalled();
    });

    it('verify NO fallback to store 1 when activeStoreId is missing or falsy', async () => {
      const mockTable = createMockTable();
      // Even if someone passes 0 or undefined, it must reject and NEVER default to store 1
      await expect(
        createOfflineKot(baseKotData, undefined, 5, mockTable)
      ).rejects.toThrow();
      expect(mockTable.add).not.toHaveBeenCalled();

      await expect(
        createOfflineKot(baseKotData, 0, 5, mockTable)
      ).rejects.toThrow();
      expect(mockTable.add).not.toHaveBeenCalled();
    });

    it('verify no incomplete KOT can be persisted to Dexie', async () => {
      const mockTable = createMockTable();

      // KOT object with partial identity: store_id present but businessDayId missing
      const partialKot1 = { ...baseKotData, store_id: 3 };
      await expect(
        createOfflineKot(partialKot1, undefined, undefined, mockTable)
      ).rejects.toThrow(/Open Business Day identity is missing or invalid/);
      expect(mockTable.add).not.toHaveBeenCalled();

      // KOT object with partial identity: businessDayId present but store_id missing
      const partialKot2 = { ...baseKotData, businessDayId: 7 };
      await expect(
        createOfflineKot(partialKot2, undefined, undefined, mockTable)
      ).rejects.toThrow(/Active Store identity is missing or invalid/);
      expect(mockTable.add).not.toHaveBeenCalled();

      // KOT object with neither identity
      const emptyIdentityKot = { ...baseKotData };
      await expect(
        createOfflineKot(emptyIdentityKot, undefined, undefined, mockTable)
      ).rejects.toThrow(/Both Active Store and Open Business Day identities are missing or invalid/);
      expect(mockTable.add).not.toHaveBeenCalled();
    });
  });

  describe('Pure identity validation function (validateOfflineKotIdentity)', () => {
    it('returns valid: true with store_id and businessDayId when both are positive integers', () => {
      const res = validateOfflineKotIdentity(3, 42);
      expect(res.valid).toBe(true);
      expect(res.store_id).toBe(3);
      expect(res.businessDayId).toBe(42);
      expect(res.error).toBeUndefined();
    });

    it('returns clear error message when both identities are missing/invalid', () => {
      const res = validateOfflineKotIdentity(undefined, undefined);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Both Active Store and Open Business Day identities are missing or invalid');
    });

    it('returns clear error message when store is missing or invalid', () => {
      const res1 = validateOfflineKotIdentity(undefined, 10);
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain('Active Store identity is missing or invalid');

      const res2 = validateOfflineKotIdentity(0, 10);
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain('Active Store identity is missing or invalid');

      const res3 = validateOfflineKotIdentity(2.5, 10);
      expect(res3.valid).toBe(false);
      expect(res3.error).toContain('Active Store identity is missing or invalid');
    });

    it('returns clear error message when business day is missing or invalid', () => {
      const res1 = validateOfflineKotIdentity(1, undefined);
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain('Open Business Day identity is missing or invalid');

      const res2 = validateOfflineKotIdentity(1, 0);
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain('Open Business Day identity is missing or invalid');

      const res3 = validateOfflineKotIdentity(1, 3.14);
      expect(res3.valid).toBe(false);
      expect(res3.error).toContain('Open Business Day identity is missing or invalid');
    });
  });
});
