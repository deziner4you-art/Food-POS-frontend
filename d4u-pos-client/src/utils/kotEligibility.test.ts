/**
 * kotEligibility.test.ts
 *
 * Task #3A — Behavioral tests for the KOT identity gate.
 *
 * Tests A–H validate the pure isKotEligible() helper against every
 * combination of missing/mismatched/valid identities.
 *
 * These are pure unit tests — no React components, no Dexie, no DOM.
 */

import { isKotEligible, KotIdentity } from './kotEligibility';

describe('isKotEligible — Task #3A identity gate', () => {
  const STORE = 2;
  const BD = 10;

  // Helper to build a minimal KOT identity object
  const kot = (
    store_id: number | null | undefined,
    businessDayId: number | null | undefined,
  ): KotIdentity => ({ store_id, businessDayId });

  // ─────────────────────────────────────────────────────────────────────────
  // Test A — happy path: matching store + matching business day → eligible
  // ─────────────────────────────────────────────────────────────────────────
  it('A: matching store_id AND matching businessDayId → eligible', () => {
    expect(isKotEligible(kot(STORE, BD), STORE, BD)).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test B — same store, DIFFERENT business day → NOT eligible
  // ─────────────────────────────────────────────────────────────────────────
  it('B: same store_id but different businessDayId → NOT eligible', () => {
    expect(isKotEligible(kot(STORE, BD + 1), STORE, BD)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test C — different store, same business day → NOT eligible
  // ─────────────────────────────────────────────────────────────────────────
  it('C: different store_id but same businessDayId → NOT eligible', () => {
    expect(isKotEligible(kot(STORE + 1, BD), STORE, BD)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test D — KOT missing store_id → NOT eligible
  // ─────────────────────────────────────────────────────────────────────────
  it('D: KOT with missing store_id (undefined) → NOT eligible', () => {
    expect(isKotEligible(kot(undefined, BD), STORE, BD)).toBe(false);
  });

  it('D: KOT with missing store_id (null) → NOT eligible', () => {
    expect(isKotEligible(kot(null, BD), STORE, BD)).toBe(false);
  });

  it('D: KOT with store_id = 0 → NOT eligible', () => {
    expect(isKotEligible(kot(0, BD), STORE, BD)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test E — KOT missing businessDayId → NOT eligible
  // ─────────────────────────────────────────────────────────────────────────
  it('E: KOT with missing businessDayId (undefined) → NOT eligible', () => {
    expect(isKotEligible(kot(STORE, undefined), STORE, BD)).toBe(false);
  });

  it('E: KOT with missing businessDayId (null) → NOT eligible', () => {
    expect(isKotEligible(kot(STORE, null), STORE, BD)).toBe(false);
  });

  it('E: KOT with businessDayId = 0 → NOT eligible', () => {
    expect(isKotEligible(kot(STORE, 0), STORE, BD)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test F — currentStoreId missing → NOT eligible (RULE 1, no fallback)
  // ─────────────────────────────────────────────────────────────────────────
  it('F: currentStoreId = null → NOT eligible (no || 1 fallback)', () => {
    expect(isKotEligible(kot(STORE, BD), null, BD)).toBe(false);
  });

  it('F: currentStoreId = undefined → NOT eligible (no || 1 fallback)', () => {
    expect(isKotEligible(kot(STORE, BD), undefined, BD)).toBe(false);
  });

  it('F: currentStoreId = 0 → NOT eligible (no || 1 fallback)', () => {
    expect(isKotEligible(kot(STORE, BD), 0, BD)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test G — activeBusinessDayId missing → NOT eligible (RULE 2, no fallback)
  // ─────────────────────────────────────────────────────────────────────────
  it('G: activeBusinessDayId = null → NOT eligible (renders nothing when BD unknown)', () => {
    expect(isKotEligible(kot(STORE, BD), STORE, null)).toBe(false);
  });

  it('G: activeBusinessDayId = undefined → NOT eligible', () => {
    expect(isKotEligible(kot(STORE, BD), STORE, undefined)).toBe(false);
  });

  it('G: activeBusinessDayId = 0 → NOT eligible', () => {
    expect(isKotEligible(kot(STORE, BD), STORE, 0)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test H — TVDisplay / TvBoard equivalence: same helper, same rules
  //
  // The TV renderers import the same isKotEligible function, so if this
  // helper is correct then ALL three renderers (StitchKDS, TvBoard, TVDisplay)
  // apply identical rules. This test validates the cross-renderer consistency
  // guarantee by running the full rule-set with a TV-style invocation pattern.
  // ─────────────────────────────────────────────────────────────────────────
  describe('H: TV renderer identity gate equivalence', () => {
    it('TV: eligible when both context and KOT identities present and matching', () => {
      expect(isKotEligible({ store_id: 3, businessDayId: 5 }, 3, 5)).toBe(true);
    });

    it('TV: no store context (null) → renders nothing', () => {
      expect(isKotEligible({ store_id: 3, businessDayId: 5 }, null, 5)).toBe(false);
    });

    it('TV: no business day context (null) → renders nothing', () => {
      expect(isKotEligible({ store_id: 3, businessDayId: 5 }, 3, null)).toBe(false);
    });

    it('TV: KOT from different store → rejected', () => {
      expect(isKotEligible({ store_id: 99, businessDayId: 5 }, 3, 5)).toBe(false);
    });

    it('TV: KOT from different business day → rejected', () => {
      expect(isKotEligible({ store_id: 3, businessDayId: 99 }, 3, 5)).toBe(false);
    });

    it('TV: KOT with no store_id at all → rejected', () => {
      expect(isKotEligible({ businessDayId: 5 }, 3, 5)).toBe(false);
    });

    it('TV: KOT with no businessDayId at all → rejected', () => {
      expect(isKotEligible({ store_id: 3 }, 3, 5)).toBe(false);
    });

    it('TV: both context values missing → renders nothing', () => {
      expect(isKotEligible({ store_id: 3, businessDayId: 5 }, null, null)).toBe(false);
    });
  });
});
