import { BACKEND_URL } from '../config/backend';

const DEVICE_ID_KEY = 'd4u_pos_device_id';
const TOKEN_KEY = 'd4u_pos_token';
const REFRESH_TOKEN_KEY = 'd4u_pos_refresh_token';

/**
 * Stable per-device identifier the backend's refresh-token rotation ties
 * sessions to (see RefreshTokenDto.device_id, @IsNotEmpty). Generated once
 * and reused across logins on this machine/browser.
 */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `pos-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
 * The POS access token expires after 1 hour (see auth.service.ts login()),
 * but a POS terminal is meant to stay logged in for a full shift. Without
 * this, every API call in the app would silently start failing with
 * "Invalid or expired authentication token" once the hour is up — this is
 * called proactively (see POSApp's refresh interval) well before that happens.
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
    console.error('Silent token refresh failed:', e);
    return false;
  }
}
