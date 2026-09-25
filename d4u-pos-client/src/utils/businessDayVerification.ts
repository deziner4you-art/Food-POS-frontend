import { isValidPosIntegerId } from '../db';

export type BusinessDayFetcher = (url: string, init?: any) => Promise<{ ok: boolean; json: () => Promise<any> }>;

/**
 * Authoritative business day verification helper (Phase 3 Final Blocker).
 *
 * Requirements:
 * 1. Must not treat a cached business-day ID as authoritative by itself.
 * 2. Verifies the current open business day from the backend for the active store.
 * 3. Returns the verified positive integer business day ID if open and valid,
 *    updating the per-store localStorage cache.
 * 4. If the backend returns:
 *    - no open day
 *    - invalid day
 *    - HTTP failure
 *    - network failure
 *    then clears localStorage cache and returns null (fail-closed).
 */
export async function verifyAuthoritativeBusinessDay(
  storeId: number | null | undefined,
  fetcher?: BusinessDayFetcher
): Promise<number | null> {
  if (!isValidPosIntegerId(storeId)) {
    return null;
  }

  try {
    const callFetch = fetcher || (async (url: string, init?: any) => {
      const { apiFetch } = await import('../pos/api');
      return apiFetch(url, init);
    });

    const res = await callFetch(`/business-day/current?store_id=${storeId}`, { auth: true });
    if (res && res.ok) {
      const data = await res.json();
      if (data && isValidPosIntegerId(data.id)) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`d4u_active_business_day_${storeId}`, String(data.id));
        }
        return data.id;
      }
    }
    // No open day, 404, or invalid id returned by backend
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`d4u_active_business_day_${storeId}`);
    }
    return null;
  } catch {
    // Network failure / timeout: fail closed
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`d4u_active_business_day_${storeId}`);
    }
    return null;
  }
}
