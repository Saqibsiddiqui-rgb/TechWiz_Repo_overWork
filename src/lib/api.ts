/**
 * Small fetch wrapper for the Campus Coin PHP API (the separate campus-coin-api folder).
 * Dev: Vite proxies /api to XAMPP (API_TARGET in .env, see vite.config.ts).
 * Production build: calls /campus-coin-api/index.php on the same Apache server,
 * or whatever VITE_API_BASE is set to in .env when you build.
 */
const BASE: string = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '/api' : '/campus-coin-api/index.php');
const TOKEN_KEY = 'campuscoin:token';

export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;
  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export const token = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* private mode */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

/** Fired when the server says the session is no longer valid, so the app can return to login. */
export const SESSION_ENDED = 'campuscoin:session-ended';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function api<T = unknown>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const t = token.get();
  if (t) headers['X-Auth-Token'] = t;

  let res: Response;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('Can\u2019t reach the Campus Coin server. Check that Apache and MySQL are running in XAMPP.', 0);
  }

  let data: { error?: string; fields?: Record<string, string>; debug?: string } & Record<string, unknown> = {};
  const text = await res.text();
  // Empty 5xx body: the Vite dev proxy couldn't connect to Apache (the terminal shows "http proxy error")
  if (!res.ok && res.status >= 500 && !text.trim()) {
    throw new ApiError(import.meta.env.DEV
      ? 'Vite couldn\u2019t connect to Apache. Start Apache in XAMPP, open http://localhost/campus-coin-api/index.php/health to check it, then restart npm run dev.'
      : 'The Campus Coin server didn\u2019t answer. Please try again in a moment.', res.status);
  }
  try { data = text ? JSON.parse(text) : {}; } catch {
    // PHP printed an error page instead of JSON (usually a syntax/config problem)
    console.error('API returned non-JSON:', text.slice(0, 500));
    const snippet = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
    throw new ApiError(
      res.status === 404
        ? 'The API wasn\u2019t found. Check that the campus-coin-api folder is in htdocs and API_TARGET in .env is right.'
        : `The server sent an unexpected response${snippet ? `: ${snippet}` : ''}`,
      res.status || 500,
    );
  }

  if (!res.ok) {
    if (data.debug) console.error('API debug:', data.debug);
    if (res.status === 401 && t) {
      token.clear();
      window.dispatchEvent(new Event(SESSION_ENDED));
    }
    // In debug mode PHP adds the technical reason; show it for server errors so it can be reported
    const detail = res.status >= 500 && data.debug ? ` (${data.debug})` : '';
    throw new ApiError((data.error ?? 'Something went wrong. Please try again.') + detail, res.status, data.fields ?? {});
  }
  return data as T;
}

/** Human message for any error thrown by api(). */
export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');
export const fieldErrors = (e: unknown) => (e instanceof ApiError ? e.fields : {});
