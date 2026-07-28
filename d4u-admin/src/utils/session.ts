import { BACKEND_URL } from './api';

const DEVICE_ID_KEY = 'd4u_admin_device_id';
const TOKEN_KEY = 'd4u_admin_token';
const REFRESH_TOKEN_KEY = 'd4u_admin_refresh_token';

/** Stable per-device identifier the backend's refresh-token rotation ties sessions to. */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function storeTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * The admin access token expires after 1 hour, but an admin session (like a
 * POS terminal) is meant to stay open for a full working session. Without
 * this, every API call would silently start failing once the hour is up —
 * shown as a generic "unexpected system error" (see utils/api.ts's message
 * sanitizer, which masks anything mentioning "token"). Called proactively,
 * well before that happens.
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken, device_id: getDeviceId() }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.access_token) return false;
    storeTokens(data.access_token, data.refresh_token);
    return true;
  } catch (e) {
    console.error('Silent admin token refresh failed:', e);
    return false;
  }
}
