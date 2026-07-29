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
// isFormData: omit Content-Type entirely for multipart/form-data requests —
// the browser must set its own `multipart/form-data; boundary=...` value,
// which it only does when no Content-Type header is present at all. See
// apiFetch() below for the enterprise-wide enforcement of this.
export const getAuthHeaders = (isFormData = false): Record<string, string> => {
  const token = localStorage.getItem('d4u_admin_token');
  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

  // Enterprise-safe, module-agnostic: any caller in any module (Marketing,
  // Inventory, CRM, Website CMS, Menu Builder, future modules, ...) that
  // passes a FormData body — file uploads, multipart form submissions —
  // automatically gets the correct headers with zero per-call opt-in.
  // Root cause this fixes: a hardcoded 'Content-Type': 'application/json'
  // was previously forced onto every request, including multipart ones,
  // which made the backend's body-parser try to JSON.parse raw multipart
  // bytes and fail with a 400 before the request ever reached the
  // controller/FileInterceptor.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const mergedHeaders: Record<string, string> = {
    ...getAuthHeaders(isFormData),
    ...(options.headers as Record<string, string> | undefined || {}),
  };
  // Belt-and-braces: strip any Content-Type a caller might still set
  // explicitly (now or in the future) when the body is FormData, so this
  // guarantee holds regardless of what any individual call site does.
  if (isFormData) {
    delete mergedHeaders['Content-Type'];
    delete mergedHeaders['content-type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
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
