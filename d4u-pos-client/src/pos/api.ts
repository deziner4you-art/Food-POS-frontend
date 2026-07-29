import { BACKEND_URL } from '../config/backend';
import type { CatalogSyncResponse, Customer } from './types';
import type { OfflineKOT } from '../db';

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

/**
 * Central fetch wrapper: applies a timeout (so a hung backend never blocks
 * the caller indefinitely) and normalizes network failures into ApiRequestError
 * so every call site can handle errors the same way.
 */
export async function apiFetch(
  path: string,
  options: RequestInit & { timeoutMs?: number; auth?: boolean } = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, auth, headers, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${API_BASE}${path}`, {
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
