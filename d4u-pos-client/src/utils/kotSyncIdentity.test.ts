/**
 * kotSyncIdentity.test.ts
 *
 * Task #3B, Remediation Batch 2 & Remediation Batch 3 (Findings 4 & 5)
 * Client-sync identity-integrity behavioral tests (F–I, Task 5 & Task 6).
 *
 * Tests the pure mapBackendKotsToDexie() function from db.ts.
 *
 * Test matrix:
 *   F. Complete backend identity → preserved exactly (store_id + businessDayId)
 *   G. Missing backend store_id  → KOT excluded (NOT stored with fabricated activeStoreId)
 *   H. Missing backend business_day_id → KOT excluded (NOT stored with fabricated BD)
 *   I. Existing backendKotId deduplication remains intact
 *   J. Task 5 — Mandatory activeStoreId and activeBusinessDayId scope enforcement
 *   K. Task 6 — Cross-scope incoming deduplication (A, B, C)
 */

import { describe, it, expect } from 'vitest';
import { mapBackendKotsToDexie } from '../db';

const DEFAULT_STORE_ID = 2;
const DEFAULT_BD_ID = 10;

// ─── Minimal backend KOT factory ────────────────────────────────────────────

function backendKot(overrides: Record<string, any> = {}) {
  return {
    id: 101,
    order_id: 500,
    store_id: DEFAULT_STORE_ID,
    business_day_id: DEFAULT_BD_ID,
    status: 'NEW',
    items: [],
    notes: '',
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    prep_time_minutes: 10,
    order: {
      order_source: 'WALKIN',
      total_amount: 500,
      payment_method: 'CASH',
      customer: null,
      onlineOrder: null,
    },
    ...overrides,
  };
}

// ─── Test F — complete identity is preserved ─────────────────────────────────

describe('F: complete backend identity → preserved exactly', () => {
  it('F1: store_id matches backend exactly (no || activeStoreId applied)', () => {
    const result = mapBackendKotsToDexie([backendKot({ store_id: 3, business_day_id: 7 })], 3, 7, new Map());
    expect(result).toHaveLength(1);
    expect(result[0].store_id).toBe(3);
  });

  it('F2: businessDayId matches backend business_day_id exactly (no || activeBusinessDayId applied)', () => {
    const result = mapBackendKotsToDexie([backendKot({ store_id: 3, business_day_id: 7 })], 3, 7, new Map());
    expect(result[0].businessDayId).toBe(7);
  });

  it('F3: backendKotId is set from k.id', () => {
    const result = mapBackendKotsToDexie([backendKot({ id: 999, store_id: 3, business_day_id: 7 })], 3, 7, new Map());
    expect(result[0].backendKotId).toBe(999);
  });

  it('F4: synced flag is always true for backend KOTs', () => {
    const result = mapBackendKotsToDexie([backendKot()], DEFAULT_STORE_ID, DEFAULT_BD_ID, new Map());
    expect(result[0].synced).toBe(true);
  });

  it('F5: _identityComplete flag is NOT present in output (stripped before return)', () => {
    const result = mapBackendKotsToDexie([backendKot()], DEFAULT_STORE_ID, DEFAULT_BD_ID, new Map());
    expect(result[0]).not.toHaveProperty('_identityComplete');
  });

  it('F6: primaryLocalMap id is used as Dexie record id when scopedKey (store_id_bdId_backendKotId) is known', () => {
    const map = new Map([['2_10_101', 55]]); // scopedKey '2_10_101' → local Dexie id 55
    const result = mapBackendKotsToDexie([backendKot({ id: 101, store_id: 2, business_day_id: 10 })], 2, 10, map);
    expect(result[0].id).toBe(55);
  });
});

// ─── Test G — missing backend store_id → KOT excluded ────────────────────────

describe('G: missing backend store_id → KOT excluded (no fabrication)', () => {
  it('G1: store_id = null → KOT not included in output', () => {
    const result = mapBackendKotsToDexie([backendKot({ store_id: null })], DEFAULT_STORE_ID, DEFAULT_BD_ID, new Map());
    expect(result).toHaveLength(0);
  });

  it('G2: store_id = undefined → KOT not included in output', () => {
    const result = mapBackendKotsToDexie([backendKot({ store_id: undefined })], DEFAULT_STORE_ID, DEFAULT_BD_ID, new Map());
    expect(result).toHaveLength(0);
  });

  it('G3: store_id = 0 → KOT not included in output (0 is falsy)', () => {
    const result = mapBackendKotsToDexie([backendKot({ store_id: 0 })], DEFAULT_STORE_ID, DEFAULT_BD_ID, new Map());
    expect(result).toHaveLength(0);
  });

  it('G4: store_id missing, activeStoreId=99 is NOT used as fallback', () => {
    const result = mapBackendKotsToDexie([backendKot({ store_id: null })], 99, DEFAULT_BD_ID, new Map());
    // Must be empty — activeStoreId (99) cannot appear as store_id
    expect(result.every((r: any) => r.store_id !== 99)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('G5: valid KOT mixed with store_id=null KOT → only valid KOT survives', () => {
    const kots = [
      backendKot({ id: 1, store_id: 2, business_day_id: 10 }),
      backendKot({ id: 2, store_id: null, business_day_id: 10 }),
    ];
    const result = mapBackendKotsToDexie(kots, 2, 10, new Map());
    expect(result).toHaveLength(1);
    expect(result[0].backendKotId).toBe(1);
  });
});

// ─── Test H — missing backend business_day_id → KOT excluded ─────────────────

describe('H: missing backend business_day_id → KOT excluded (no fabrication)', () => {
  it('H1: business_day_id = null → KOT not included in output', () => {
    const result = mapBackendKotsToDexie([backendKot({ business_day_id: null })], DEFAULT_STORE_ID, DEFAULT_BD_ID, new Map());
    expect(result).toHaveLength(0);
  });

  it('H2: business_day_id = undefined → KOT not included in output', () => {
    const result = mapBackendKotsToDexie([backendKot({ business_day_id: undefined })], DEFAULT_STORE_ID, DEFAULT_BD_ID, new Map());
    expect(result).toHaveLength(0);
  });

  it('H3: business_day_id = 0 → KOT not included in output (0 is falsy)', () => {
    const result = mapBackendKotsToDexie([backendKot({ business_day_id: 0 })], DEFAULT_STORE_ID, DEFAULT_BD_ID, new Map());
    expect(result).toHaveLength(0);
  });

  it('H4: activeBusinessDayId (e.g. 99) is NOT used as fabricated businessDayId', () => {
    const result = mapBackendKotsToDexie([backendKot({ business_day_id: null })], DEFAULT_STORE_ID, 99, new Map());
    expect(result.every((r: any) => r.businessDayId !== 99)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('H5: valid KOT mixed with business_day_id=null KOT → only valid KOT survives', () => {
    const kots = [
      backendKot({ id: 1, store_id: 2, business_day_id: 10 }),
      backendKot({ id: 2, store_id: 2, business_day_id: null }),
    ];
    const result = mapBackendKotsToDexie(kots, 2, 10, new Map());
    expect(result).toHaveLength(1);
    expect(result[0].backendKotId).toBe(1);
  });

  it('H6: both store_id and business_day_id missing → KOT excluded', () => {
    const result = mapBackendKotsToDexie(
      [backendKot({ store_id: null, business_day_id: null })],
      DEFAULT_STORE_ID,
      DEFAULT_BD_ID,
      new Map(),
    );
    expect(result).toHaveLength(0);
  });
});

// ─── Task #3B-1 GAP 2 — Authoritative Business-Day Field (Tests 7–11 / Cases A–E) ───

describe('Task #3B-1 GAP 2: Authoritative Business-Day Field (7–11 / Cases A–E)', () => {
  it('7 / Case A: business_day_id = 99, businessDayId = 88 → authoritative business_day_id wins (uses 99)', () => {
    const raw = backendKot({
      store_id: 2,
      business_day_id: 99,
      businessDayId: 88, // alternate client field must be ignored
    });
    const result = mapBackendKotsToDexie([raw], 2, 99, new Map());
    expect(result).toHaveLength(1);
    expect(result[0].businessDayId).toBe(99);
  });

  it('8 / Case B: business_day_id = null, businessDayId = 88 → dropped', () => {
    const raw = backendKot({
      store_id: 2,
      business_day_id: null,
      businessDayId: 88,
    });
    const result = mapBackendKotsToDexie([raw], 2, 88, new Map());
    expect(result).toHaveLength(0);
  });

  it('9 / Case C: business_day_id = undefined, businessDayId = 88 → dropped', () => {
    const raw = backendKot({
      store_id: 2,
      business_day_id: undefined,
      businessDayId: 88,
    });
    const result = mapBackendKotsToDexie([raw], 2, 88, new Map());
    expect(result).toHaveLength(0);
  });

  it('10 / Case D: both business_day_id and businessDayId missing → dropped', () => {
    const raw = backendKot({
      store_id: 2,
    });
    delete (raw as any).business_day_id;
    delete (raw as any).businessDayId;
    const result = mapBackendKotsToDexie([raw], 2, DEFAULT_BD_ID, new Map());
    expect(result).toHaveLength(0);
  });

  it('11 / Case E: business_day_id valid (e.g. 77), businessDayId absent → exact backend value preserved', () => {
    const raw = backendKot({
      store_id: 2,
      business_day_id: 77,
    });
    delete (raw as any).businessDayId;
    const result = mapBackendKotsToDexie([raw], 2, 77, new Map());
    expect(result).toHaveLength(1);
    expect(result[0].businessDayId).toBe(77);
  });
});

// ─── Test I — backendKotId deduplication remains intact ─────────────────────

describe('I: backendKotId deduplication remains intact', () => {
  it('I1: two backend KOTs with the same id → only one entry in output', () => {
    const kots = [
      backendKot({ id: 42, store_id: 2, business_day_id: 10 }),
      backendKot({ id: 42, store_id: 2, business_day_id: 10 }), // duplicate
    ];
    const result = mapBackendKotsToDexie(kots, 2, 10, new Map());
    expect(result).toHaveLength(1);
    expect(result[0].backendKotId).toBe(42);
  });

  it('I2: two distinct backend KOTs → two entries in output', () => {
    const kots = [
      backendKot({ id: 1, store_id: 2, business_day_id: 10 }),
      backendKot({ id: 2, store_id: 2, business_day_id: 10 }),
    ];
    const result = mapBackendKotsToDexie(kots, 2, 10, new Map());
    expect(result).toHaveLength(2);
    const ids = result.map((r: any) => r.backendKotId).sort();
    expect(ids).toEqual([1, 2]);
  });

  it('I3: primaryLocalMap id is preserved for existing Dexie rows using scoped key', () => {
    const map = new Map([['2_10_42', 7]]); // scopedKey '2_10_42' → local Dexie id 7
    const result = mapBackendKotsToDexie(
      [backendKot({ id: 42, store_id: 2, business_day_id: 10 })],
      2,
      10,
      map,
    );
    expect(result[0].id).toBe(7);
  });

  it('I4: new KOT (not in primaryLocalMap) gets id=undefined for Dexie auto-increment', () => {
    const result = mapBackendKotsToDexie(
      [backendKot({ id: 99, store_id: 2, business_day_id: 10 })],
      2,
      10,
      new Map(), // empty map → no existing local row
    );
    expect(result[0].id).toBeUndefined();
  });

  it('I5: identity-incomplete KOTs are excluded BEFORE dedup, not after', () => {
    // Mix: one valid, one null-BD duplicate of the valid backendKotId
    const kots = [
      backendKot({ id: 42, store_id: 2, business_day_id: 10 }), // valid
      backendKot({ id: 42, store_id: 2, business_day_id: null }), // incomplete — excluded
    ];
    const result = mapBackendKotsToDexie(kots, 2, 10, new Map());
    // Only the valid one survives; the incomplete one doesn't replace it
    expect(result).toHaveLength(1);
    expect(result[0].businessDayId).toBe(10);
  });
});

// ─── Task 5 — Mandatory activeStoreId and activeBusinessDayId Scope Enforcement ───

describe('Task 5: mapBackendKotsToDexie mandatory scope contract', () => {
  const validKot = backendKot({ id: 10, store_id: 1, business_day_id: 5 });

  it('rejects safely (returns []) when activeStoreId is missing, null, undefined, 0, or negative', () => {
    expect(mapBackendKotsToDexie([validKot], undefined as any, 5)).toEqual([]);
    expect(mapBackendKotsToDexie([validKot], null as any, 5)).toEqual([]);
    expect(mapBackendKotsToDexie([validKot], 0, 5)).toEqual([]);
    expect(mapBackendKotsToDexie([validKot], -1, 5)).toEqual([]);
    expect(mapBackendKotsToDexie([validKot], NaN as any, 5)).toEqual([]);
  });

  it('rejects safely (returns []) when activeBusinessDayId is missing, null, undefined, 0, or negative', () => {
    expect(mapBackendKotsToDexie([validKot], 1, undefined as any)).toEqual([]);
    expect(mapBackendKotsToDexie([validKot], 1, null as any)).toEqual([]);
    expect(mapBackendKotsToDexie([validKot], 1, 0)).toEqual([]);
    expect(mapBackendKotsToDexie([validKot], 1, -5)).toEqual([]);
    expect(mapBackendKotsToDexie([validKot], 1, NaN as any)).toEqual([]);
  });

  it('returns empty array when incomingBackendKots is empty or non-array', () => {
    expect(mapBackendKotsToDexie([], 1, 5)).toEqual([]);
    expect(mapBackendKotsToDexie(null as any, 1, 5)).toEqual([]);
    expect(mapBackendKotsToDexie(undefined as any, 1, 5)).toEqual([]);
  });
});

// ─── Task 6 — Cross-Scope Incoming Deduplication (A, B, C) ───────────────────

describe('Task 6: Cross-Scope Incoming Deduplication', () => {
  it('Case A: Store 1 / Day 10 / backendKotId 100 vs Store 2 / Day 10 / backendKotId 100 must remain TWO independent records', () => {
    const kot1 = backendKot({ id: 100, store_id: 1, business_day_id: 10 });
    const kot2 = backendKot({ id: 100, store_id: 2, business_day_id: 10 });

    const result = mapBackendKotsToDexie([kot1, kot2], 1, 10, new Map());

    expect(result).toHaveLength(2);
    const storeIds = result.map((r: any) => r.store_id).sort();
    expect(storeIds).toEqual([1, 2]);
    expect(result.every((r: any) => r.backendKotId === 100)).toBe(true);
  });

  it('Case B: Store 1 / Day 10 / backendKotId 100 vs Store 1 / Day 11 / backendKotId 100 must remain TWO independent records', () => {
    const kot1 = backendKot({ id: 100, store_id: 1, business_day_id: 10 });
    const kot2 = backendKot({ id: 100, store_id: 1, business_day_id: 11 });

    const result = mapBackendKotsToDexie([kot1, kot2], 1, 10, new Map());

    expect(result).toHaveLength(2);
    const dayIds = result.map((r: any) => r.businessDayId).sort();
    expect(dayIds).toEqual([10, 11]);
    expect(result.every((r: any) => r.backendKotId === 100)).toBe(true);
  });

  it('Case C: Store 1 / Day 10 / backendKotId 100 vs Store 1 / Day 10 / backendKotId 100 reconciles as a duplicate (1 record)', () => {
    const kot1 = backendKot({ id: 100, store_id: 1, business_day_id: 10, notes: 'first' });
    const kot2 = backendKot({ id: 100, store_id: 1, business_day_id: 10, notes: 'second' });

    const result = mapBackendKotsToDexie([kot1, kot2], 1, 10, new Map());

    expect(result).toHaveLength(1);
    expect(result[0].backendKotId).toBe(100);
    expect(result[0].store_id).toBe(1);
    expect(result[0].businessDayId).toBe(10);
  });
});
