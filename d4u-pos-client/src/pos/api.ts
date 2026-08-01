import { BACKEND_URL } from '../config/backend';
import type { CatalogSyncResponse, Customer } from './types';
import type { OfflineKOT } from '../db';
import { refreshAccessToken, clearTokens } from './session';

const API_BASE = BACKEND_URL;
const DEFAULT_TIMEOUT_MS = 15000;

const getToken = () => localStorage.getItem('d4u_pos_token') ?? '';

export class ApiRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with HTTP ${response.status}`;
    try {
      const body = await response.clone().json();
      if (body?.message) message = body.message;
    } catch {
      // response body wasn't JSON — keep the generic HTTP status message
    }
    throw new ApiRequestError(message, response.status);
  }
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------
// Session recovery
//
// The access token expiring mid-session used to surface as "Invalid or
// expired authentication token" on whatever the cashier happened to click
// next (see docs/investigations for the forensic trace) — nothing had
// re-checked the token since page load, because Incoming Orders updates
// arrive over the socket, not REST. This section makes every authenticated
// apiFetch call check the token first, refresh it silently if needed, and
// fall back to one retry if the server rejects it anyway (clock skew,
// server-side revocation, etc.) — never a second retry, and never a stale
// token left behind if recovery isn't possible. No backend, JWT, or auth
// endpoint changes; this only decides *when* to call the refresh endpoint
// that already existed.
// ---------------------------------------------------------------

/**
 * Reads the token's own `exp` claim to decide whether it's worth sending —
 * this never verifies the signature (only the server does that, on every
 * request, unchanged) and is purely a client-side optimization to avoid
 * firing a request already known to fail.
 */
function isTokenExpired(token: string): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload?.exp) return false; // no exp claim to check — let the server decide
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // unparseable — treat as expired, refresh (or logout) will sort it out
  }
}

// Concurrent callers that all notice an expired/rejected token share one
// in-flight refresh instead of each firing their own /auth/refresh call.
let refreshInFlight: Promise<boolean> | null = null;
function forceRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Proactive check used before sending a request — only refreshes if the token actually looks expired. */
function ensureFreshToken(): Promise<boolean> {
  if (!isTokenExpired(getToken())) return Promise.resolve(true);
  return forceRefresh();
}

/**
 * Clears both tokens and hands off to the app's existing logout flow via
 * the same window-CustomEvent pattern already used for subscription_suspended
 * (see App.tsx) — api.ts is a plain module with no access to React state,
 * so it can't call handleLogout() directly, and shouldn't duplicate what
 * that function already does (clearing the user/day-start/cash-in state).
 */
function forceSessionLogout() {
  clearTokens();
  window.dispatchEvent(new CustomEvent('auth_session_expired'));
}

/**
 * Central fetch wrapper: applies a timeout (so a hung backend never blocks
 * the caller indefinitely), normalizes network failures into ApiRequestError,
 * and — for auth:true calls — keeps the access token fresh automatically:
 * a proactive check/refresh before the request, and one reactive
 * refresh+retry if the server rejects the token anyway. Never retries twice.
 */
export async function apiFetch(
  path: string,
  options: RequestInit & { timeoutMs?: number; auth?: boolean; _retried?: boolean } = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, auth, headers, _retried, ...rest } = options;

  if (auth) {
    const ready = await ensureFreshToken();
    if (!ready) {
      forceSessionLogout();
      throw new ApiRequestError('Session expired. Please log in again.', 401);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        ...(auth ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...headers,
      },
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new ApiRequestError(`Request to ${path} timed out after ${timeoutMs}ms`);
    }
    throw new ApiRequestError(`Network request to ${path} failed: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  if (auth && response.status === 401 && !_retried) {
    const recovered = await forceRefresh();
    if (recovered) {
      return apiFetch(path, { ...options, _retried: true });
    }
    forceSessionLogout();
  }

  return response;
}

export async function fetchCatalog(storeId: number): Promise<CatalogSyncResponse> {
  const response = await apiFetch(`/catalog/category-groups/hierarchy/store/${storeId}?channel=pos`);
  return readJson<CatalogSyncResponse>(response);
}

export async function fetchCustomers(params: {
  brandId: number;
  storeId: number;
  search?: string;
}): Promise<Customer[]> {
  const query = new URLSearchParams({
    brand_id: String(params.brandId),
    store_id: String(params.storeId),
  });

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  const response = await apiFetch(`/customers?${query.toString()}`, { auth: true });
  return readJson<Customer[]>(response);
}

/** Returns the matching customer, or null if no customer exists for this phone (not an error case). */
export async function lookupCustomerByPhone(phone: string): Promise<Customer | null> {
  const response = await apiFetch(`/customers/phone/${encodeURIComponent(phone)}`);
  if (response.status === 404) return null;
  const data = await readJson<Customer>(response);
  return data?.id ? data : null;
}

export async function createCustomer(payload: {
  brand_id: number;
  phone: string;
  name: string;
}): Promise<Customer> {
  const response = await apiFetch('/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await readJson<{ success: boolean; customer: Customer }>(response);
  return data.customer;
}

export async function syncOfflineOrders(orders: OfflineKOT[]): Promise<{ ok: boolean }> {
  const response = await apiFetch('/pos-orders/sync-offline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders }),
    timeoutMs: 20000,
  });
  if (!response.ok) {
    throw new ApiRequestError(`Offline sync failed with HTTP ${response.status}`, response.status);
  }
  return { ok: true };
}
