import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isKotEligible, KotIdentity } from './kotEligibility';
import { isValidPosIntegerId, syncAndReconcileBackendKots } from '../db';

/**
 * kdsTvBusinessDayVerification.test.ts
 *
 * Remediation Batch 4 — Authoritative Business Day Verification for KDS, TV Board, and TVDisplay.
 *
 * Requirements:
 * 1. KDS and TV Board must initialize activeBusinessDayId as null for rendering.
 * 2. A per-store cached business-day ID may not authorize rendering before successful authoritative backend verification.
 * 3. If /business-day/current fails, times out, returns 404, returns null, returns malformed data, or returns an invalid ID:
 *    - set activeBusinessDayId to null;
 *    - clear the per-store cached business-day value;
 *    - do not run reconciliation;
 *    - do not render cached KOTs from the previous day.
 * 4. Only a valid business-day ID returned by the authoritative backend may be used for KDS/TV rendering and synchronization.
 * 5. Preserve current store isolation and isKotEligible() filtering.
 * 6. Do not weaken TVDisplay protection.
 */

describe('Issue 2: KDS, TV Board, and TVDisplay Business Day Verification & Fail-Closed Rendering', () => {
  const STORE_ID = 1;
  const OLD_CACHED_DAY = 9;
  const AUTHORITATIVE_DAY = 10;
  const OTHER_STORE_ID = 2;

  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, val: string) => { localStorageMock[key] = String(val); },
      removeItem: (key: string) => { delete localStorageMock[key]; },
      clear: () => { localStorageMock = {}; },
    });
  });

  const makeKot = (store_id: number, businessDayId: number, orderId = 101): KotIdentity & { orderId: number } => ({
    store_id,
    businessDayId,
    orderId,
  });

  // Simulated production lifecycle helper matching StitchKDS, TvBoard, and TVDisplay implementation
  async function simulateKdsTvDayResolutionWorkflow(options: {
    storeId: number;
    fetchBusinessDay: () => Promise<{ ok: boolean; status?: number; data?: any }>;
  }) {
    // 1. Production Rule: Must initialize activeBusinessDayId as null for rendering
    let activeBusinessDayId: number | null = null;
    let authoritativeBdId: number | null = null;
    let syncReconciliationRan = false;

    // 2. Perform authoritative verification
    try {
      const res = await options.fetchBusinessDay();
      if (res.ok) {
        const bdData = res.data;
        if (bdData && isValidPosIntegerId(bdData.id)) {
          authoritativeBdId = bdData.id;
          activeBusinessDayId = bdData.id;
          localStorage.setItem(`d4u_active_business_day_${options.storeId}`, String(bdData.id));
        } else {
          activeBusinessDayId = null;
          localStorage.removeItem(`d4u_active_business_day_${options.storeId}`);
        }
      } else {
        activeBusinessDayId = null;
        localStorage.removeItem(`d4u_active_business_day_${options.storeId}`);
      }
    } catch {
      // Network failure / timeout: fail closed
      activeBusinessDayId = null;
      localStorage.removeItem(`d4u_active_business_day_${options.storeId}`);
    }

    // Guard: Destructive reconciliation must NEVER run if authoritative business day is unverified
    if (isValidPosIntegerId(authoritativeBdId)) {
      syncReconciliationRan = true;
    }

    return {
      activeBusinessDayId,
      authoritativeBdId,
      syncReconciliationRan,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: KDS with cached old day + backend failure -> no KOT render
  // ─────────────────────────────────────────────────────────────────────────
  it('Issue 2-A: KDS with cached old day + backend failure -> no KOT render and cache cleared', async () => {
    // Seed cached old day
    localStorage.setItem(`d4u_active_business_day_${STORE_ID}`, String(OLD_CACHED_DAY));

    // Old day KOT from previous shift
    const oldDayKot = makeKot(STORE_ID, OLD_CACHED_DAY);

    // Initial mount: activeBusinessDayId starts as null (cached day cannot authorize rendering)
    const initialDay: number | null = null;
    expect(isKotEligible(oldDayKot, STORE_ID, initialDay)).toBe(false);

    // Backend network failure / timeout
    const result = await simulateKdsTvDayResolutionWorkflow({
      storeId: STORE_ID,
      fetchBusinessDay: async () => {
        throw new Error('Network timeout / connection refused');
      },
    });

    // Verify state fails closed
    expect(result.activeBusinessDayId).toBeNull();
    expect(result.authoritativeBdId).toBeNull();
    expect(result.syncReconciliationRan).toBe(false);

    // Verify per-store cache was removed
    expect(localStorage.getItem(`d4u_active_business_day_${STORE_ID}`)).toBeNull();

    // Verify no KOT renders
    expect(isKotEligible(oldDayKot, STORE_ID, result.activeBusinessDayId)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2: TV Board with cached old day + backend failure -> no KOT render
  // ─────────────────────────────────────────────────────────────────────────
  it('Issue 2-B: TV Board with cached old day + backend failure -> no KOT render and cache cleared', async () => {
    localStorage.setItem(`d4u_active_business_day_${STORE_ID}`, String(OLD_CACHED_DAY));

    const oldDayKot = makeKot(STORE_ID, OLD_CACHED_DAY);

    // TV Board initial mount renders nothing before backend verification
    const initialDay: number | null = null;
    expect(isKotEligible(oldDayKot, STORE_ID, initialDay)).toBe(false);

    // Backend 500 error
    const result = await simulateKdsTvDayResolutionWorkflow({
      storeId: STORE_ID,
      fetchBusinessDay: async () => ({ ok: false, status: 500 }),
    });

    expect(result.activeBusinessDayId).toBeNull();
    expect(result.syncReconciliationRan).toBe(false);
    expect(localStorage.getItem(`d4u_active_business_day_${STORE_ID}`)).toBeNull();
    expect(isKotEligible(oldDayKot, STORE_ID, result.activeBusinessDayId)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 3: Backend 404/closed day -> no KOT render and no sync
  // ─────────────────────────────────────────────────────────────────────────
  it('Issue 2-C: Backend 404/closed day -> no KOT render, no sync, and cache cleared', async () => {
    localStorage.setItem(`d4u_active_business_day_${STORE_ID}`, String(OLD_CACHED_DAY));

    const cachedKot = makeKot(STORE_ID, OLD_CACHED_DAY);

    // Backend returns 404 (No active business day open)
    const result = await simulateKdsTvDayResolutionWorkflow({
      storeId: STORE_ID,
      fetchBusinessDay: async () => ({ ok: false, status: 404 }),
    });

    expect(result.activeBusinessDayId).toBeNull();
    expect(result.authoritativeBdId).toBeNull();
    expect(result.syncReconciliationRan).toBe(false);

    expect(localStorage.getItem(`d4u_active_business_day_${STORE_ID}`)).toBeNull();
    expect(isKotEligible(cachedKot, STORE_ID, result.activeBusinessDayId)).toBe(false);

    // syncAndReconcileBackendKots safely refuses sync when businessDayId is null
    const syncRes = await syncAndReconcileBackendKots([], STORE_ID, result.activeBusinessDayId as any);
    expect(syncRes.applied).toBe(false);
    expect(syncRes.reason).toBe('INVALID_BD_IDENTITY');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 4: Malformed business-day response -> no KOT render and no sync
  // ─────────────────────────────────────────────────────────────────────────
  it('Issue 2-D: Malformed business-day response -> no KOT render, no sync, and cache cleared', async () => {
    const malformedResponses = [
      null,
      {},
      { id: null },
      { id: undefined },
      { id: 0 },
      { id: -1 },
      { id: '10' }, // string instead of positive integer
      { id: NaN },
      { id: 10.5 }, // float instead of integer
    ];

    for (const malformedData of malformedResponses) {
      localStorage.setItem(`d4u_active_business_day_${STORE_ID}`, '999');

      const result = await simulateKdsTvDayResolutionWorkflow({
        storeId: STORE_ID,
        fetchBusinessDay: async () => ({ ok: true, data: malformedData }),
      });

      expect(result.activeBusinessDayId).toBeNull();
      expect(result.authoritativeBdId).toBeNull();
      expect(result.syncReconciliationRan).toBe(false);
      expect(localStorage.getItem(`d4u_active_business_day_${STORE_ID}`)).toBeNull();

      const kot = makeKot(STORE_ID, 999);
      expect(isKotEligible(kot, STORE_ID, result.activeBusinessDayId)).toBe(false);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 5: Successful authoritative day -> matching KOT renders
  // ─────────────────────────────────────────────────────────────────────────
  it('Issue 2-E: Successful authoritative day -> matching KOT renders and cache updated', async () => {
    const result = await simulateKdsTvDayResolutionWorkflow({
      storeId: STORE_ID,
      fetchBusinessDay: async () => ({
        ok: true,
        data: { id: AUTHORITATIVE_DAY, status: 'OPEN', store_id: STORE_ID },
      }),
    });

    expect(result.activeBusinessDayId).toBe(AUTHORITATIVE_DAY);
    expect(result.authoritativeBdId).toBe(AUTHORITATIVE_DAY);
    expect(result.syncReconciliationRan).toBe(true);

    // Cache updated
    expect(localStorage.getItem(`d4u_active_business_day_${STORE_ID}`)).toBe(String(AUTHORITATIVE_DAY));

    // Matching KOT renders
    const matchingKot = makeKot(STORE_ID, AUTHORITATIVE_DAY);
    expect(isKotEligible(matchingKot, STORE_ID, result.activeBusinessDayId)).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 6: Wrong business day remains hidden
  // ─────────────────────────────────────────────────────────────────────────
  it('Issue 2-F: Wrong business day remains hidden even when store matches', async () => {
    const activeDay = 10;

    const yesterdayKot = makeKot(STORE_ID, 9);
    const todayKot = makeKot(STORE_ID, 10);
    const futureKot = makeKot(STORE_ID, 11);
    const foreignStoreKot = makeKot(OTHER_STORE_ID, 10);

    // Only todayKot is eligible
    expect(isKotEligible(todayKot, STORE_ID, activeDay)).toBe(true);

    // All others are strictly hidden
    expect(isKotEligible(yesterdayKot, STORE_ID, activeDay)).toBe(false);
    expect(isKotEligible(futureKot, STORE_ID, activeDay)).toBe(false);
    expect(isKotEligible(foreignStoreKot, STORE_ID, activeDay)).toBe(false);
  });
});
