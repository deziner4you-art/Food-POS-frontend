import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitWebsiteOrder, resolveWebsiteStoreAndBusinessDay } from '../website/App';
import type { CartItem } from '../website/types';

describe('Task #3C-2: Embedded Website Offline KOT Creation Guard', () => {
  let storage: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, val: string) => {
      storage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      storage = {};
    },
  };

  const createMockTable = () => ({
    add: vi.fn().mockImplementation(async (record: any) => 1),
  });

  const mockCart: CartItem[] = [
    {
      foodItem: {
        id: '4',
        name: 'Zinger Deluxe',
        price: 'Rs. 750',
        priceRs: 750,
        category: 'Burgers',
        description: 'Crispy chicken fillet with cheese and fresh lettuce',
        image: 'zinger.jpg',
      },
      quantity: 2,
    },
  ];

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('resolveWebsiteStoreAndBusinessDay', () => {
    it('resolves valid store and per-store business day from localStorage', () => {
      storage['d4u_main_user'] = JSON.stringify({ id: 1, store_id: 2, name: 'Cashier' });
      storage['d4u_active_business_day_2'] = '10';

      const { activeStoreId, activeBusinessDayId } = resolveWebsiteStoreAndBusinessDay();
      expect(activeStoreId).toBe(2);
      expect(activeBusinessDayId).toBe(10);
    });

    it('rejects generic d4u_active_business_day_id if per-store key is absent (Task B)', () => {
      storage['d4u_main_user'] = JSON.stringify({ id: 1, store_id: 3 });
      storage['d4u_active_business_day_id'] = '15';

      const { activeStoreId, activeBusinessDayId } = resolveWebsiteStoreAndBusinessDay();
      expect(activeStoreId).toBe(3);
      expect(activeBusinessDayId).toBeUndefined();
    });

    it('returns undefined for activeStoreId if user is missing (no fallback to store 1)', () => {
      const { activeStoreId, activeBusinessDayId } = resolveWebsiteStoreAndBusinessDay();
      expect(activeStoreId).toBeUndefined();
      expect(activeBusinessDayId).toBeUndefined();
    });
  });

  describe('submitWebsiteOrder focused behavioral test matrix', () => {
    it('A: valid store + valid business day -> KOT persisted with both identities', async () => {
      storage['d4u_main_user'] = JSON.stringify({ id: 1, store_id: 2, name: 'Cashier' });
      storage['d4u_active_business_day_2'] = '10';

      const mockTable = createMockTable();
      await submitWebsiteOrder(mockCart, mockTable);

      expect(mockTable.add).toHaveBeenCalledTimes(1);
      const persisted = mockTable.add.mock.calls[0][0];

      expect(persisted.store_id).toBe(2);
      expect(persisted.businessDayId).toBe(10);
      expect(persisted.synced).toBe(false);
      expect(persisted.source).toBe('Website');
      expect(persisted.type).toBe('Online');
      expect(persisted.status).toBe('PENDING');
      expect(persisted.totalAmount).toBe(1500); // 750 * 2
      expect(persisted.items).toContain('2x Zinger Deluxe');
    });

    it('B: missing store -> no KOT write', async () => {
      // No d4u_main_user in storage, business day present
      storage['d4u_active_business_day_id'] = '10';

      const mockTable = createMockTable();
      await expect(submitWebsiteOrder(mockCart, mockTable)).rejects.toThrow(
        /Active Store.*missing or invalid/
      );

      expect(mockTable.add).not.toHaveBeenCalled();
    });

    it('C: missing business day -> no KOT write', async () => {
      // Valid store present, but no active business day in storage
      storage['d4u_main_user'] = JSON.stringify({ id: 1, store_id: 2 });

      const mockTable = createMockTable();
      await expect(submitWebsiteOrder(mockCart, mockTable)).rejects.toThrow(
        /Open Business Day identity is missing or invalid/
      );

      expect(mockTable.add).not.toHaveBeenCalled();
    });

    it('C2: generic d4u_active_business_day_id present without store-scoped key -> rejected (Task B)', async () => {
      storage['d4u_main_user'] = JSON.stringify({ id: 1, store_id: 2 });
      storage['d4u_active_business_day_id'] = '10'; // generic key only, not store-scoped

      const mockTable = createMockTable();
      await expect(submitWebsiteOrder(mockCart, mockTable)).rejects.toThrow(
        /Open Business Day identity is missing or invalid/
      );

      expect(mockTable.add).not.toHaveBeenCalled();
    });

    it('D: invalid store -> no KOT write (store_id = 0, fractional, NaN)', async () => {
      storage['d4u_active_business_day_id'] = '10';

      // Case 1: store_id = 0
      storage['d4u_main_user'] = JSON.stringify({ id: 1, store_id: 0 });
      const mockTable1 = createMockTable();
      await expect(submitWebsiteOrder(mockCart, mockTable1)).rejects.toThrow(
        /Active Store.*missing or invalid/
      );
      expect(mockTable1.add).not.toHaveBeenCalled();

      // Case 2: store_id = 2.5
      storage['d4u_main_user'] = JSON.stringify({ id: 1, store_id: 2.5 });
      const mockTable2 = createMockTable();
      await expect(submitWebsiteOrder(mockCart, mockTable2)).rejects.toThrow(
        /Active Store.*missing or invalid/
      );
      expect(mockTable2.add).not.toHaveBeenCalled();
    });

    it('E: invalid business day -> no KOT write (businessDayId = 0, fractional, NaN)', async () => {
      storage['d4u_main_user'] = JSON.stringify({ id: 1, store_id: 2 });

      // Case 1: business day = "0"
      storage['d4u_active_business_day_2'] = '0';
      const mockTable1 = createMockTable();
      await expect(submitWebsiteOrder(mockCart, mockTable1)).rejects.toThrow(
        /Open Business Day identity is missing or invalid/
      );
      expect(mockTable1.add).not.toHaveBeenCalled();

      // Case 2: business day = "10.5"
      storage['d4u_active_business_day_2'] = '10.5';
      const mockTable2 = createMockTable();
      await expect(submitWebsiteOrder(mockCart, mockTable2)).rejects.toThrow(
        /Open Business Day identity is missing or invalid/
      );
      expect(mockTable2.add).not.toHaveBeenCalled();
    });

    it('rejects empty cart before validating or persisting', async () => {
      storage['d4u_main_user'] = JSON.stringify({ id: 1, store_id: 2 });
      storage['d4u_active_business_day_2'] = '10';

      const mockTable = createMockTable();
      await expect(submitWebsiteOrder([], mockTable)).rejects.toThrow('Your cart is empty!');
      expect(mockTable.add).not.toHaveBeenCalled();
    });
  });
});
