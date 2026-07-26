const BACKEND_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://pos-api.deziner4you.com';

// ─── Enterprise Logger ────────────────────────────────────────────────────────
// Production-ready: swap console.error for Sentry/other without touching callers
export const logger = {
  error: (message: string, context?: any) => {
    if (import.meta.env.MODE === 'production') {
      // TODO: plug in Sentry → Sentry.captureException(context)
    } else {
      console.error(`[D4U ERROR] ${message}`, context ?? '');
    }
  },
  warn: (message: string, context?: any) => {
    console.warn(`[D4U WARN] ${message}`, context ?? '');
  },
  info: (message: string, context?: any) => {
    if (import.meta.env.MODE !== 'production') {
      console.info(`[D4U INFO] ${message}`, context ?? '');
    }
  },
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('d4u_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── Centralised HTTP error handler ──────────────────────────────────────────
function handleHttpError(status: number, url: string) {
  switch (status) {
    case 401:
      logger.error(`401 Unauthorized → ${url}`);
      if (!url.includes('/auth/login')) {
        localStorage.removeItem('d4u_admin_token');
        localStorage.removeItem('d4u_admin_user');
        window.location.href = '/admin';
      }
      break;
    case 403:
      logger.error(`403 Forbidden → ${url}`);
      // Emit a global event so any page can display an "Access Denied" toast
      window.dispatchEvent(new CustomEvent('d4u:apierror', { detail: { code: 403, message: 'Access Denied. You do not have permission to perform this action.' } }));
      break;
    case 404:
      logger.warn(`404 Not Found → ${url}`);
      break;
    case 500:
      logger.error(`500 Internal Server Error → ${url}`);
      window.dispatchEvent(new CustomEvent('d4u:apierror', { detail: { code: 500, message: 'A system error occurred. Please try again or contact support.' } }));
      break;
    default:
      if (status >= 400) {
        logger.warn(`HTTP ${status} → ${url}`);
      }
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const isExternal = endpoint.startsWith('http');
  const url = isExternal ? endpoint : `${BACKEND_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    // Central HTTP error handling
    if (!response.ok) {
      handleHttpError(response.status, url);
    }

    // Wrap .json() to sanitise internal error messages for production
    const originalJson = response.json.bind(response);
    response.json = async () => {
      try {
        const data = await originalJson();
        if (!response.ok && data?.message) {
          const msg = String(data.message).toLowerCase();
          if (
            msg.includes('jwt') ||
            msg.includes('token') ||
            msg.includes('cannot read property') ||
            msg.includes('undefined')
          ) {
            logger.error('[Enterprise Error Intercepted]', { raw: data.message });
            data.message = 'An unexpected system error occurred. Please try again.';
          }
        }
        return data;
      } catch (e) {
        if (!response.ok) {
          return { message: 'An unexpected system error occurred.' };
        }
        throw e;
      }
    };

    return response;
  } catch (networkError) {
    // Network-level failure (offline, CORS, DNS)
    logger.error('Network Error — backend unreachable', networkError);
    window.dispatchEvent(
      new CustomEvent('d4u:apierror', {
        detail: {
          code: 0,
          message: 'Cannot reach the server. Please check your internet connection.',
        },
      }),
    );
    // Return a synthetic failed response so callers don't crash
    return new Response(JSON.stringify({ message: 'Network error.' }), {
      status: 0,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export { BACKEND_URL };
