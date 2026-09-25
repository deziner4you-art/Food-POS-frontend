import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isKotEligible } from './kotEligibility';
import {
  syncAndReconcileBackendKots,
  resetSyncSequences,
  closeSeqDb,
} from '../db';
import { verifyAuthoritativeBusinessDay } from './businessDayVerification';
import { isDeliveryEligible, isDeliveryActiveStatus, filterEligibleDeliveries, applyKdsDeliveryUpdate } from './deliveryEligibility';
import fs from 'fs';
import path from 'path';

describe('Phase 3 Final Task: Close All Active KOT Identity Bypasses', () => {
  const CURRENT_STORE = 1;
  const CURRENT_BD = 10;

  function createMockDb(initial: any[] = []) {
    let records = JSON.parse(JSON.stringify(initial));
    const toArraySpy = vi.fn().mockImplementation(async () => [...records]);
    const bulkDeleteSpy = vi.fn().mockImplementation(async (ids: number[]) => {
      const idSet = new Set(ids);
      records = records.filter(r => !idSet.has(r.id));
    });
    const bulkPutSpy = vi.fn().mockImplementation(async (items: any[]) => {
      for (const item of items) {
        if (item.id != null) {
          const idx = records.findIndex(r => r.id === item.id);
          if (idx >= 0) records[idx] = { ...records[idx], ...item };
          else records.push({ ...item });
        } else {
          const maxId = records.reduce((m, r) => (r.id != null && r.id > m ? r.id : m), 0);
          records.push({ ...item, id: maxId + 1 });
        }
      }
    });
    const transactionSpy = vi.fn().mockImplementation(async (_mode: string, _table: any, callback: () => Promise<void>) => {
      return await callback();
    });

    return {
      kots: {
        toArray: toArraySpy,
        bulkDelete: bulkDeleteSpy,
        bulkPut: bulkPutSpy,
      },
      transaction: transactionSpy,
      get records() { return records; },
    };
  }

  function makeBackendKot(id: number, storeId: any = 1, bdId: any = 10, status = 'PREPARING') {
    return {
      id,
      order_id: 1000 + id,
      store_id: storeId,
      business_day_id: bdId,
      status,
      items: `[{"name":"Item ${id}","qty":1}]`,
      notes: '',
      createdAt: new Date().toISOString(),
      order: {
        order_source: 'DELIVERY',
        total_amount: 150,
        payment_method: 'CASH',
      },
    };
  }

  beforeEach(async () => {
    await closeSeqDb();
    resetSyncSequences();
  });

  // ─── 1. POS KOT Rendering & Filtering Tests ─────────────────────────────────

  describe('1. Active POS KOT rendering identity enforcement', () => {
    it('Active POS KOT rendering rejects missing store identity (null / undefined / 0)', () => {
      const kotWithValidStore = { id: 1, store_id: CURRENT_STORE, businessDayId: CURRENT_BD, status: 'PREPARING' };
      const kotWithMissingStore = { id: 2, store_id: undefined, businessDayId: CURRENT_BD, status: 'PREPARING' };
      const kotWithNullStore = { id: 3, store_id: null, businessDayId: CURRENT_BD, status: 'PREPARING' };
      const kotWithZeroStore = { id: 4, store_id: 0, businessDayId: CURRENT_BD, status: 'PREPARING' };

      // KOTs lacking store_id must be rejected
      expect(isKotEligible(kotWithMissingStore, CURRENT_STORE, CURRENT_BD)).toBe(false);
      expect(isKotEligible(kotWithNullStore, CURRENT_STORE, CURRENT_BD)).toBe(false);
      expect(isKotEligible(kotWithZeroStore, CURRENT_STORE, CURRENT_BD)).toBe(false);

      // Current context lacking store_id must reject ALL KOTs
      expect(isKotEligible(kotWithValidStore, null, CURRENT_BD)).toBe(false);
      expect(isKotEligible(kotWithValidStore, undefined, CURRENT_BD)).toBe(false);
      expect(isKotEligible(kotWithValidStore, 0, CURRENT_BD)).toBe(false);

      // In POSApp: rawKots filtered by isKotEligible
      const rawKots = [kotWithValidStore, kotWithMissingStore, kotWithNullStore, kotWithZeroStore];
      const eligible = rawKots.filter(k => isKotEligible(k, CURRENT_STORE, CURRENT_BD));
      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe(1);
    });

    it('Active POS KOT rendering rejects missing business-day identity (null / undefined / 0)', () => {
      const kotWithValidBd = { id: 1, store_id: CURRENT_STORE, businessDayId: CURRENT_BD, status: 'PREPARING' };
      const kotWithMissingBd = { id: 2, store_id: CURRENT_STORE, businessDayId: undefined, status: 'PREPARING' };
      const kotWithNullBd = { id: 3, store_id: CURRENT_STORE, businessDayId: null, status: 'PREPARING' };
      const kotWithZeroBd = { id: 4, store_id: CURRENT_STORE, businessDayId: 0, status: 'PREPARING' };

      // KOTs lacking businessDayId must be rejected
      expect(isKotEligible(kotWithMissingBd, CURRENT_STORE, CURRENT_BD)).toBe(false);
      expect(isKotEligible(kotWithNullBd, CURRENT_STORE, CURRENT_BD)).toBe(false);
      expect(isKotEligible(kotWithZeroBd, CURRENT_STORE, CURRENT_BD)).toBe(false);

      // Current context lacking business-day must reject ALL KOTs
      expect(isKotEligible(kotWithValidBd, CURRENT_STORE, null)).toBe(false);
      expect(isKotEligible(kotWithValidBd, CURRENT_STORE, undefined)).toBe(false);
      expect(isKotEligible(kotWithValidBd, CURRENT_STORE, 0)).toBe(false);

      const rawKots = [kotWithValidBd, kotWithMissingBd, kotWithNullBd, kotWithZeroBd];
      const eligible = rawKots.filter(k => isKotEligible(k, CURRENT_STORE, CURRENT_BD));
      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe(1);
    });

    it('Active POS KOT rendering rejects wrong store', () => {
      const validKot = { id: 1, store_id: CURRENT_STORE, businessDayId: CURRENT_BD, status: 'PREPARING' };
      const wrongStoreKot = { id: 2, store_id: 2, businessDayId: CURRENT_BD, status: 'PREPARING' };
      const anotherStoreKot = { id: 3, store_id: 99, businessDayId: CURRENT_BD, status: 'PREPARING' };

      expect(isKotEligible(wrongStoreKot, CURRENT_STORE, CURRENT_BD)).toBe(false);
      expect(isKotEligible(anotherStoreKot, CURRENT_STORE, CURRENT_BD)).toBe(false);

      const rawKots = [validKot, wrongStoreKot, anotherStoreKot];
      const eligible = rawKots.filter(k => isKotEligible(k, CURRENT_STORE, CURRENT_BD));
      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe(1);
    });

    it('Active POS KOT rendering rejects wrong business day', () => {
      const validKot = { id: 1, store_id: CURRENT_STORE, businessDayId: CURRENT_BD, status: 'PREPARING' };
      const yesterdayKot = { id: 2, store_id: CURRENT_STORE, businessDayId: CURRENT_BD - 1, status: 'PREPARING' };
      const futureKot = { id: 3, store_id: CURRENT_STORE, businessDayId: CURRENT_BD + 5, status: 'PREPARING' };

      expect(isKotEligible(yesterdayKot, CURRENT_STORE, CURRENT_BD)).toBe(false);
      expect(isKotEligible(futureKot, CURRENT_STORE, CURRENT_BD)).toBe(false);

      const rawKots = [validKot, yesterdayKot, futureKot];
      const eligible = rawKots.filter(k => isKotEligible(k, CURRENT_STORE, CURRENT_BD));
      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe(1);
    });

    it('Gated KOTs feed filteredKots, mappedOrders, and KOT counters without identity leak', () => {
      const rawKots = [
        { id: 1, orderId: 101, store_id: CURRENT_STORE, businessDayId: CURRENT_BD, status: 'PREPARING', type: 'Dine In', items: '[{"name":"Burger","qty":1}]', customer: 'Alice' },
        { id: 2, orderId: 102, store_id: 2, businessDayId: CURRENT_BD, status: 'PREPARING', type: 'Dine In', items: '[{"name":"Pizza","qty":1}]', customer: 'Bob' },
        { id: 3, orderId: 103, store_id: CURRENT_STORE, businessDayId: 99, status: 'PREPARING', type: 'Dine In', items: '[{"name":"Pasta","qty":1}]', customer: 'Charlie' },
      ];

      // POSApp implementation:
      const kots = rawKots.filter(k => isKotEligible(k, CURRENT_STORE, CURRENT_BD));

      // filteredKots
      const filteredKots = kots.filter(k => k.status === 'PREPARING');
      expect(filteredKots).toHaveLength(1);
      expect(filteredKots[0].customer).toBe('Alice');

      // mappedOrders
      const mappedOrders = kots.map(k => ({ id: k.orderId.toString(), status: k.status }));
      expect(mappedOrders).toHaveLength(1);
      expect(mappedOrders[0].id).toBe('101');

      // KOT counter
      const preparingCount = kots.filter(k => k.status === 'PREPARING').length;
      expect(preparingCount).toBe(1);
    });
  });

  // ─── 2. READY Notifications and Delivery Insertion ──────────────────────────

  describe('2. READY notification and delivery insertion identity gate', () => {
    it('READY notification/delivery insertion rejects ineligible KOTs', () => {
      const toastCalls: any[] = [];
      const setToast = (t: any) => toastCalls.push(t);
      let activeDeliveries: any[] = [];
      const setActiveDeliveries = (fn: (prev: any[]) => any[]) => {
        activeDeliveries = fn(activeDeliveries);
      };

      // Simulate POSApp newlyReady processing
      const processNewlyReady = (kot: any, activeStoreId: number | null, activeBusinessDayId: number | null) => {
        // Identity Gate in POSApp
        if (!isKotEligible(kot, activeStoreId, activeBusinessDayId)) return;

        if (kot.type === 'Delivery') {
          setToast({ message: `Kitchen has completed Order #${kot.orderId}`, type: 'success' });
          setActiveDeliveries(prev => [
            ...prev,
            { id: kot.orderId, bridgeOrderId: kot.orderId, status: 'READY', customer: kot.customer },
          ]);
        }
      };

      // 1. Ineligible: wrong store
      const wrongStoreKot = { orderId: 201, store_id: 2, businessDayId: CURRENT_BD, type: 'Delivery', status: 'READY', customer: 'Foreign Store Customer' };
      processNewlyReady(wrongStoreKot, CURRENT_STORE, CURRENT_BD);
      expect(toastCalls).toHaveLength(0);
      expect(activeDeliveries).toHaveLength(0);

      // 2. Ineligible: wrong business day
      const wrongDayKot = { orderId: 202, store_id: CURRENT_STORE, businessDayId: 99, type: 'Delivery', status: 'READY', customer: 'Yesterday Customer' };
      processNewlyReady(wrongDayKot, CURRENT_STORE, CURRENT_BD);
      expect(toastCalls).toHaveLength(0);
      expect(activeDeliveries).toHaveLength(0);

      // 3. Ineligible: missing store_id
      const missingStoreKot = { orderId: 203, store_id: null, businessDayId: CURRENT_BD, type: 'Delivery', status: 'READY', customer: 'No Store Customer' };
      processNewlyReady(missingStoreKot, CURRENT_STORE, CURRENT_BD);
      expect(toastCalls).toHaveLength(0);
      expect(activeDeliveries).toHaveLength(0);

      // 4. Ineligible: missing businessDayId
      const missingDayKot = { orderId: 204, store_id: CURRENT_STORE, businessDayId: null, type: 'Delivery', status: 'READY', customer: 'No Day Customer' };
      processNewlyReady(missingDayKot, CURRENT_STORE, CURRENT_BD);
      expect(toastCalls).toHaveLength(0);
      expect(activeDeliveries).toHaveLength(0);

      // 5. Eligible: correct store & active business day
      const eligibleKot = { orderId: 205, store_id: CURRENT_STORE, businessDayId: CURRENT_BD, type: 'Delivery', status: 'READY', customer: 'Valid Customer' };
      processNewlyReady(eligibleKot, CURRENT_STORE, CURRENT_BD);
      expect(toastCalls).toHaveLength(1);
      expect(toastCalls[0].message).toContain('205');
      expect(activeDeliveries).toHaveLength(1);
      expect(activeDeliveries[0].id).toBe(205);
    });
  });

  // ─── 3. Reconciliation Scoping & Rejecting Foreign KOTs ─────────────────────

  describe('3. syncAndReconcileBackendKots reconciliation scope isolation', () => {
    it('Incoming wrong-store backend KOT is not written by reconciliation', async () => {
      const mockDb = createMockDb();

      // Incoming payload contains a KOT from Store 2 during Store 1 sync
      const incoming = [
        makeBackendKot(101, 1, 10, 'PREPARING'),
        makeBackendKot(102, 2, 10, 'PREPARING'), // Wrong store
      ];

      const result = await syncAndReconcileBackendKots(incoming, 1, 10, 1, mockDb as any);
      expect(result.applied).toBe(true);

      // Only Store 1 KOT was written
      expect(mockDb.records).toHaveLength(1);
      expect(mockDb.records[0].backendKotId).toBe(101);
      expect(mockDb.records[0].store_id).toBe(1);
      expect(mockDb.records[0].businessDayId).toBe(10);
    });

    it('Incoming wrong-business-day backend KOT is not written by reconciliation', async () => {
      const mockDb = createMockDb();

      // Incoming payload contains a KOT from Day 99 during Day 10 sync
      const incoming = [
        makeBackendKot(201, 1, 10, 'PREPARING'),
        makeBackendKot(202, 1, 99, 'PREPARING'), // Wrong business day
      ];

      const result = await syncAndReconcileBackendKots(incoming, 1, 10, 1, mockDb as any);
      expect(result.applied).toBe(true);

      // Only Day 10 KOT was written
      expect(mockDb.records).toHaveLength(1);
      expect(mockDb.records[0].backendKotId).toBe(201);
      expect(mockDb.records[0].store_id).toBe(1);
      expect(mockDb.records[0].businessDayId).toBe(10);
    });

    it('Valid current-scope KOT still writes correctly', async () => {
      const mockDb = createMockDb();

      const incoming = [
        makeBackendKot(301, 1, 10, 'PREPARING'),
        makeBackendKot(302, 1, 10, 'READY'),
      ];

      const result = await syncAndReconcileBackendKots(incoming, 1, 10, 1, mockDb as any);
      expect(result.applied).toBe(true);

      expect(mockDb.records).toHaveLength(2);
      expect(mockDb.records.map((r: any) => r.backendKotId).sort()).toEqual([301, 302]);
      expect(mockDb.records.every((r: any) => r.store_id === 1 && r.businessDayId === 10)).toBe(true);
    });

    it('Mixed batch: wrong-store, wrong-day, and valid KOTs are accurately partitioned', async () => {
      const mockDb = createMockDb();

      const incoming = [
        makeBackendKot(401, 1, 10, 'PREPARING'), // Valid
        makeBackendKot(402, 2, 10, 'PREPARING'), // Wrong store
        makeBackendKot(403, 1, 11, 'PREPARING'), // Wrong day
        makeBackendKot(404, 3, 99, 'PREPARING'), // Wrong store and day
        makeBackendKot(405, 1, 10, 'READY'),     // Valid
      ];

      const result = await syncAndReconcileBackendKots(incoming, 1, 10, 1, mockDb as any);
      expect(result.applied).toBe(true);

      // Only 401 and 405 must be written
      expect(mockDb.records).toHaveLength(2);
      expect(mockDb.records.map((r: any) => r.backendKotId).sort()).toEqual([401, 405]);
    });
  });

  // ─── 4. Legacy KitchenDisplay.tsx Verification ──────────────────────────────

  describe('4. Legacy KitchenDisplay verification', () => {
    it('Legacy KitchenDisplay path is demonstrably unreachable from active routing', () => {
      const appTsxPath = path.resolve(__dirname, '../App.tsx');
      const appContent = fs.readFileSync(appTsxPath, 'utf8');

      // Verify App.tsx explicitly imports StitchKDS for KitchenDisplay
      expect(appContent).toContain("import KitchenDisplay from './StitchKDS'");

      // Verify legacy KitchenDisplay.tsx is NOT imported by App.tsx
      expect(appContent).not.toMatch(/from ['"]\.\/KitchenDisplay['"]/);
    });

    it('Legacy KitchenDisplay component enforces isKotEligible identity gate', () => {
      const legacyKdPath = path.resolve(__dirname, '../KitchenDisplay.tsx');
      const legacyKdContent = fs.readFileSync(legacyKdPath, 'utf8');

      // Verify legacy KitchenDisplay imports isKotEligible
      expect(legacyKdContent).toContain("import { isKotEligible } from './utils/kotEligibility';");

      // Verify it filters rawKots by isKotEligible
      expect(legacyKdContent).toContain('rawKots.filter(k => isKotEligible(k, activeStoreId, activeBusinessDayId))');
    });
  });

  // ─── 5. Authoritative POS Business-Day Context Verification ─────────────────

  describe('5. Authoritative POS Business-Day Context Verification (Phase 3 Final Blocker)', () => {
    let mockLocalStorage: Record<string, string>;

    beforeEach(() => {
      mockLocalStorage = {};
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => mockLocalStorage[key] ?? null,
        setItem: (key: string, val: string) => { mockLocalStorage[key] = String(val); },
        removeItem: (key: string) => { delete mockLocalStorage[key]; },
        clear: () => { mockLocalStorage = {}; },
      });
    });

    it('POSApp source initializes activeBusinessDayId as null (unverified)', () => {
      const appTsxPath = path.resolve(__dirname, '../App.tsx');
      const appContent = fs.readFileSync(appTsxPath, 'utf8');

      // Verify activeBusinessDayId is initialized to null in POSApp
      expect(appContent).toContain('const [activeBusinessDayId, setActiveBusinessDayId] = useState<number | null>(null);');
      // Verify verifyAuthoritativeBusinessDay is imported and invoked
      expect(appContent).toContain('verifyAuthoritativeBusinessDay(activeStoreId)');
    });

    it('stale localStorage day + backend returns a newer day → old KOT not rendered', async () => {
      // 1. Stale localStorage day is 10
      mockLocalStorage['d4u_active_business_day_1'] = '10';

      // 2. Backend returns newer day 11
      const mockFetch: any = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 11 }),
      });

      const verifiedDay = await verifyAuthoritativeBusinessDay(1, mockFetch);
      expect(verifiedDay).toBe(11);
      expect(mockLocalStorage['d4u_active_business_day_1']).toBe('11');

      // 3. Old KOT (day 10) vs New KOT (day 11)
      const oldKot = { id: 1, orderId: 101, store_id: 1, businessDayId: 10, status: 'PREPARING' };
      const newKot = { id: 2, orderId: 102, store_id: 1, businessDayId: 11, status: 'PREPARING' };

      expect(isKotEligible(oldKot, 1, verifiedDay)).toBe(false); // Old KOT rejected!
      expect(isKotEligible(newKot, 1, verifiedDay)).toBe(true);  // Only matching KOT renders!
    });

    it('stale localStorage day + backend returns no open day → no KOT rendered', async () => {
      // 1. Stale localStorage day is 10
      mockLocalStorage['d4u_active_business_day_1'] = '10';

      // 2. Backend returns 200 with null / no open day
      const mockFetch: any = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: null, message: 'No open business day' }),
      });

      const verifiedDay = await verifyAuthoritativeBusinessDay(1, mockFetch);
      expect(verifiedDay).toBeNull();
      expect(mockLocalStorage['d4u_active_business_day_1']).toBeUndefined();

      // 3. Old KOT matching old cache (day 10) must NOT render
      const kot = { id: 1, orderId: 101, store_id: 1, businessDayId: 10, status: 'PREPARING' };
      expect(isKotEligible(kot, 1, verifiedDay)).toBe(false);
    });

    it('backend day request fails (404/500/network) → no KOT rendered and no READY watcher action', async () => {
      mockLocalStorage['d4u_active_business_day_1'] = '10';

      // 1. Backend throws network error
      const mockFetchError: any = vi.fn().mockRejectedValue(new Error('Network offline'));
      const verifiedDay = await verifyAuthoritativeBusinessDay(1, mockFetchError);
      expect(verifiedDay).toBeNull();
      expect(mockLocalStorage['d4u_active_business_day_1']).toBeUndefined();

      // 2. KOTs are not rendered
      const kot = { id: 1, orderId: 101, store_id: 1, businessDayId: 10, type: 'Delivery', status: 'READY' };
      expect(isKotEligible(kot, 1, verifiedDay)).toBe(false);

      // 3. READY watcher action rejects KOT and inserts nothing into activeDeliveries
      const toastCalls: any[] = [];
      const activeDeliveries: any[] = [];
      if (isKotEligible(kot, 1, verifiedDay)) {
        toastCalls.push(kot);
        activeDeliveries.push(kot);
      }
      expect(toastCalls).toHaveLength(0);
      expect(activeDeliveries).toHaveLength(0);
    });

    it('valid backend day → only matching KOT renders', async () => {
      const mockFetch: any = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 25 }),
      });

      const verifiedDay = await verifyAuthoritativeBusinessDay(1, mockFetch);
      expect(verifiedDay).toBe(25);

      const matchingKot = { id: 1, store_id: 1, businessDayId: 25, status: 'PREPARING' };
      const yesterdayKot = { id: 2, store_id: 1, businessDayId: 24, status: 'PREPARING' };
      const tomorrowKot = { id: 3, store_id: 1, businessDayId: 26, status: 'PREPARING' };

      expect(isKotEligible(matchingKot, 1, verifiedDay)).toBe(true);
      expect(isKotEligible(yesterdayKot, 1, verifiedDay)).toBe(false);
      expect(isKotEligible(tomorrowKot, 1, verifiedDay)).toBe(false);
    });

    it('store mismatch → rejected', () => {
      const wrongStoreKot = { id: 1, store_id: 2, businessDayId: 25, status: 'PREPARING' };
      expect(isKotEligible(wrongStoreKot, 1, 25)).toBe(false);
    });

    it('business-day mismatch → rejected', () => {
      const wrongDayKot = { id: 1, store_id: 1, businessDayId: 99, status: 'PREPARING' };
      expect(isKotEligible(wrongDayKot, 1, 25)).toBe(false);
    });

    it('READY ineligible KOT cannot enter activeDeliveries', () => {
      const activeDeliveries: any[] = [];
      const newlyReadyKots = [
        { id: 1, orderId: 101, store_id: 1, businessDayId: 99, status: 'READY', type: 'Delivery' }, // wrong day
        { id: 2, orderId: 102, store_id: 2, businessDayId: 25, status: 'READY', type: 'Delivery' }, // wrong store
        { id: 3, orderId: 103, store_id: null, businessDayId: 25, status: 'READY', type: 'Delivery' }, // missing store
        { id: 4, orderId: 104, store_id: 1, businessDayId: null, status: 'READY', type: 'Delivery' }, // missing day
      ];

      // Newly ready handler with identity gate
      newlyReadyKots.forEach(kot => {
        if (!isKotEligible(kot, 1, 25)) return;
        activeDeliveries.push({ id: kot.orderId, status: 'READY' });
      });

      expect(activeDeliveries).toHaveLength(0);
    });
  });

  describe('Task: POS Active Delivery Business-Day Fail-Closed Gate', () => {
    const STORE_ID = 1;
    const AUTHORITATIVE_BD = 42;

    it('unverified business day (null) -> delivery rendering list and count are strictly empty', () => {
      const unverifiedBusinessDayId: number | null = null;
      const deliveries = [
        { id: 1, store_id: STORE_ID, businessDayId: 42, status: 'READY' },
        { id: 2, store_id: STORE_ID, businessDayId: 42, status: 'OUT_FOR_DELIVERY' },
      ];

      const visible = filterEligibleDeliveries(deliveries, STORE_ID, unverifiedBusinessDayId);
      expect(visible).toHaveLength(0);
      expect(visible.filter(d => isDeliveryActiveStatus(d.status)).length).toBe(0);
    });

    it('unverified store context (null/0) -> delivery rendering list is strictly empty', () => {
      const deliveries = [
        { id: 1, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'READY' },
      ];

      expect(filterEligibleDeliveries(deliveries, null, AUTHORITATIVE_BD)).toHaveLength(0);
      expect(filterEligibleDeliveries(deliveries, 0, AUTHORITATIVE_BD)).toHaveLength(0);
      expect(filterEligibleDeliveries(deliveries, undefined, AUTHORITATIVE_BD)).toHaveLength(0);
    });

    it('old-business-day delivery card cannot appear even if status is active (READY, OUT_FOR_DELIVERY, WAITING_CASH_SETTLEMENT)', () => {
      const oldDeliveries = [
        { id: 10, store_id: STORE_ID, businessDayId: 41, status: 'READY' },
        { id: 11, store_id: STORE_ID, businessDayId: 40, status: 'OUT_FOR_DELIVERY' },
        { id: 12, store_id: STORE_ID, businessDayId: 39, status: 'WAITING_CASH_SETTLEMENT' },
      ];

      for (const d of oldDeliveries) {
        expect(isDeliveryEligible(d, STORE_ID, AUTHORITATIVE_BD)).toBe(false);
      }
      const visible = filterEligibleDeliveries(oldDeliveries, STORE_ID, AUTHORITATIVE_BD);
      expect(visible).toHaveLength(0);
    });

    it('foreign store delivery card cannot appear even on matching business day', () => {
      const foreignStoreCard = { id: 20, store_id: 2, businessDayId: AUTHORITATIVE_BD, status: 'READY' };
      expect(isDeliveryEligible(foreignStoreCard, STORE_ID, AUTHORITATIVE_BD)).toBe(false);
      expect(filterEligibleDeliveries([foreignStoreCard], STORE_ID, AUTHORITATIVE_BD)).toHaveLength(0);
    });

    it('pre-READY lifecycle states (PENDING, CONFIRMED, PREPARING) are rejected by gate', () => {
      const preReadyCards = [
        { id: 31, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'PENDING' },
        { id: 32, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'CONFIRMED' },
        { id: 33, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'PREPARING' },
      ];

      for (const card of preReadyCards) {
        expect(isDeliveryEligible(card, STORE_ID, AUTHORITATIVE_BD)).toBe(false);
      }
      expect(filterEligibleDeliveries(preReadyCards, STORE_ID, AUTHORITATIVE_BD)).toHaveLength(0);
    });

    it('terminal lifecycle states (SETTLED, CANCELLED, VOIDED) are rejected by gate', () => {
      const terminalCards = [
        { id: 41, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'SETTLED' },
        { id: 42, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'CANCELLED' },
        { id: 43, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'VOIDED' },
      ];

      for (const card of terminalCards) {
        expect(isDeliveryEligible(card, STORE_ID, AUTHORITATIVE_BD)).toBe(false);
      }
      expect(filterEligibleDeliveries(terminalCards, STORE_ID, AUTHORITATIVE_BD)).toHaveLength(0);
    });

    it('authoritative verified day and matching store allow active delivery cards to render', () => {
      const mixedCards = [
        { id: 101, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'READY' },
        { id: 102, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'DISPATCHED' },
        { id: 103, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'OUT_FOR_DELIVERY' },
        { id: 104, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'DELIVERED' },
        { id: 105, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'WAITING_CASH_SETTLEMENT' },
        // Invalid or stale cards mixed in
        { id: 106, store_id: STORE_ID, businessDayId: 40, status: 'READY' }, // old day
        { id: 107, store_id: 2, businessDayId: AUTHORITATIVE_BD, status: 'READY' }, // foreign store
        { id: 108, store_id: STORE_ID, businessDayId: AUTHORITATIVE_BD, status: 'SETTLED' }, // settled
      ];

      const visible = filterEligibleDeliveries(mixedCards, STORE_ID, AUTHORITATIVE_BD);
      expect(visible).toHaveLength(5);
      expect(visible.map(d => d.id)).toEqual([101, 102, 103, 104, 105]);
    });

    it('verification failure clears existing active deliveries and renders empty list/map', async () => {
      let activeDeliveries: any[] = [
        { id: 201, store_id: STORE_ID, businessDayId: 42, status: 'READY' },
      ];

      // Verification fails
      const mockFetch: any = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const verifiedDay = await verifyAuthoritativeBusinessDay(STORE_ID, mockFetch);
      expect(verifiedDay).toBeNull();

      // State reset triggered on verification failure / null day
      if (verifiedDay === null) {
        activeDeliveries = [];
      }

      const visible = filterEligibleDeliveries(activeDeliveries, STORE_ID, verifiedDay);
      expect(visible).toHaveLength(0);
      expect(activeDeliveries).toHaveLength(0);
    });

    it('business day transition purges previous day deliveries upon new verification', async () => {
      let activeDeliveries: any[] = [
        { id: 301, store_id: STORE_ID, businessDayId: 42, status: 'READY' },
        { id: 302, store_id: STORE_ID, businessDayId: 42, status: 'OUT_FOR_DELIVERY' },
      ];

      // New day opened: business day 43
      const mockFetch: any = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 43 }),
      });

      const newVerifiedDay = await verifyAuthoritativeBusinessDay(STORE_ID, mockFetch);
      expect(newVerifiedDay).toBe(43);

      // Filtering with new verified day completely excludes day 42 cards
      const visible = filterEligibleDeliveries(activeDeliveries, STORE_ID, newVerifiedDay);
      expect(visible).toHaveLength(0);

      // And recovery with new day replaces/purges old cards
      activeDeliveries = activeDeliveries.filter(d => isDeliveryEligible(d, STORE_ID, newVerifiedDay));
      expect(activeDeliveries).toHaveLength(0);
    });

    describe('production KDS socket delivery reducer', () => {
      const baseDelivery = {
        id: 501,
        bridgeOrderId: 501,
        store_id: STORE_ID,
        businessDayId: AUTHORITATIVE_BD,
        status: 'PREPARING',
      };

      it('updates a matching store and business-day delivery to READY', () => {
        const result = applyKdsDeliveryUpdate(
          [baseDelivery],
          { order_id: 501, status: 'READY', store_id: STORE_ID, business_day_id: AUTHORITATIVE_BD },
          STORE_ID,
          AUTHORITATIVE_BD,
        );

        expect(result.deliveries).toHaveLength(1);
        expect(result.deliveries[0].status).toBe('READY');
        expect(result.becameReadyDeliveryId).toBe(501);
      });

      it('ignores a matching-store event from the wrong business day', () => {
        const result = applyKdsDeliveryUpdate(
          [baseDelivery],
          { order_id: 501, status: 'READY', store_id: STORE_ID, business_day_id: AUTHORITATIVE_BD + 1 },
          STORE_ID,
          AUTHORITATIVE_BD,
        );

        expect(result.deliveries).toEqual([baseDelivery]);
        expect(result.becameReadyDeliveryId).toBeNull();
      });

      it('ignores an event from the wrong store', () => {
        const result = applyKdsDeliveryUpdate(
          [baseDelivery],
          { order_id: 501, status: 'READY', store_id: STORE_ID + 1, business_day_id: AUTHORITATIVE_BD },
          STORE_ID,
          AUTHORITATIVE_BD,
        );

        expect(result.deliveries).toEqual([baseDelivery]);
      });

      it('ignores an event with missing business-day identity', () => {
        const result = applyKdsDeliveryUpdate(
          [baseDelivery],
          { order_id: 501, status: 'READY', store_id: STORE_ID },
          STORE_ID,
          AUTHORITATIVE_BD,
        );

        expect(result.deliveries).toEqual([baseDelivery]);
      });

      it('ignores all delivery mutations while the active business day is unverified', () => {
        const result = applyKdsDeliveryUpdate(
          [baseDelivery],
          { order_id: 501, status: 'READY', store_id: STORE_ID, business_day_id: AUTHORITATIVE_BD },
          STORE_ID,
          null,
        );

        expect(result.deliveries).toEqual([baseDelivery]);
      });

      it('removes a delivery when KDS reports PREPARING so pre-READY state is never active', () => {
        const readyDelivery = { ...baseDelivery, status: 'READY' };
        const result = applyKdsDeliveryUpdate(
          [readyDelivery],
          { order_id: 501, status: 'PREPARING', store_id: STORE_ID, business_day_id: AUTHORITATIVE_BD },
          STORE_ID,
          AUTHORITATIVE_BD,
        );

        expect(result.deliveries).toEqual([]);
        expect(result.becameReadyDeliveryId).toBeNull();
      });
    });
  });
});
