/**
 * kotEligibility.ts
 *
 * Pure eligibility helper — determines whether a KOT record is renderable
 * in the current session context (KDS, TV Board, TV Display).
 *
 * Rules (Task #3A — all four rules must pass simultaneously):
 *
 *   RULE 1 — NO CURRENT STORE  = NO KOT
 *     currentStoreId must be a non-null, non-zero number.
 *     There is NO hardcoded store fallback.
 *
 *   RULE 2 — NO CURRENT BUSINESS DAY = NO KOT
 *     activeBusinessDayId must be a non-null, non-zero number.
 *     Missing / null / undefined activeBusinessDayId rejects the KOT.
 *
 *   RULE 3 — KOT IDENTITY REQUIRED
 *     k.store_id must be a non-null, non-zero number.
 *     k.businessDayId must be a non-null, non-zero number.
 *
 *   RULE 4 — BOTH IDENTITIES MUST MATCH
 *     k.store_id        === currentStoreId
 *     k.businessDayId   === activeBusinessDayId
 */

export interface KotIdentity {
  store_id?: number | null;
  businessDayId?: number | null;
}

/**
 * Returns true ONLY when:
 *   - currentStoreId is defined and non-zero
 *   - activeBusinessDayId is defined and non-zero
 *   - k.store_id is defined, non-zero, and equals currentStoreId
 *   - k.businessDayId is defined, non-zero, and equals activeBusinessDayId
 *
 * Returns false in every other case — including when context values are
 * null/undefined, zero, or when the KOT lacks either identity field.
 */
export function isKotEligible(
  k: KotIdentity,
  currentStoreId: number | null | undefined,
  activeBusinessDayId: number | null | undefined,
): boolean {
  // RULE 1: current store context must be known and valid
  if (!currentStoreId) return false;

  // RULE 2: current business day context must be known and valid
  if (!activeBusinessDayId) return false;

  // RULE 3a: KOT must carry store_id
  if (!k.store_id) return false;

  // RULE 3b: KOT must carry businessDayId
  if (!k.businessDayId) return false;

  // RULE 4a: KOT store must match current session store
  if (k.store_id !== currentStoreId) return false;

  // RULE 4b: KOT business day must match current session business day
  if (k.businessDayId !== activeBusinessDayId) return false;

  return true;
}
