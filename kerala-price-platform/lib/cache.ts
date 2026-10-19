/**
 * Ultra-light client-side fetch cache.
 *
 * Features:
 *  • In-memory TTL cache so multiple components hitting the same URL
 *    get a single response (no duplicate network requests).
 *  • In-flight deduplication — concurrent calls for the same URL share
 *    one pending Promise instead of firing N parallel requests.
 *  • SessionStorage warm cache — data survives tab navigation; on the
 *    next page visit stale data renders instantly while a fresh fetch
 *    runs in the background (stale-while-revalidate).
 *
 * TTLs (milliseconds):
 *   Default 5 min | insights/summary 2 min | source 10 min
 */

const TTL_DEFAULT  = 5 * 60 * 1000;   // 5 min
const TTL_SHORT    = 2 * 60 * 1000;   // 2 min  (insights, summary)
const TTL_LONG     = 10 * 60 * 1000;  // 10 min (source info)

const SESSION_PREFIX = "kcp:";

// ─── Per-URL TTL overrides ────────────────────────────────────────────────────
function ttlFor(url: string): number {
  if (url.includes("/insights") || url.includes("/summary")) return TTL_SHORT;
  if (url.includes("/source"))                                return TTL_LONG;
  return TTL_DEFAULT;
}

// ─── Memory store ─────────────────────────────────────────────────────────────
interface Entry { data: unknown; expiry: number }
const mem = new Map<string, Entry>();

// ─── In-flight map ────────────────────────────────────────────────────────────
const inflight = new Map<string, Promise<unknown>>();

// ─── SessionStorage helpers ───────────────────────────────────────────────────
function ssGet(key: string): { data: unknown; expiry: number } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as { data: unknown; expiry: number };
  } catch { return null; }
}

function ssSet(key: string, data: unknown, expiry: number): void {
  if (typeof sessionStorage === "undefined") return;
  try { sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify({ data, expiry })); }
  catch { /* quota exceeded — ignore */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch `url` with caching + in-flight deduplication.
 * If `onStale` is provided and there is unexpired session data, `onStale`
 * is called immediately with the cached value while a fresh fetch runs
 * in the background.
 */
export async function cachedFetch<T>(
  url: string,
  fetchFn: () => Promise<T>,
  onStale?: (stale: T) => void,
): Promise<T> {
  const now = Date.now();
  const ttl  = ttlFor(url);

  // 1. Fresh memory hit
  const memEntry = mem.get(url);
  if (memEntry && memEntry.expiry > now) return memEntry.data as T;

  // 2. SessionStorage stale-while-revalidate
  const ssEntry = ssGet(url);
  if (ssEntry && ssEntry.expiry > now) {
    // Still fresh in session — promote to memory and return
    mem.set(url, ssEntry);
    return ssEntry.data as T;
  }

  if (ssEntry && onStale) {
    // Stale — deliver immediately, revalidate in background
    onStale(ssEntry.data as T);
  }

  // 3. Deduplicate in-flight requests
  const existing = inflight.get(url);
  if (existing) return existing as Promise<T>;

  const promise = fetchFn().then((data) => {
    const expiry = Date.now() + ttl;
    mem.set(url, { data, expiry });
    ssSet(url, data, expiry);
    inflight.delete(url);
    return data;
  }).catch((err) => {
    inflight.delete(url);
    throw err;
  });

  inflight.set(url, promise);
  return promise as Promise<T>;
}

/** Invalidate a cached URL (e.g. after a manual refresh). */
export function invalidate(urlSubstring: string): void {
  for (const key of mem.keys()) {
    if (key.includes(urlSubstring)) mem.delete(key);
  }
  if (typeof sessionStorage !== "undefined") {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i) ?? "";
      if (k.startsWith(SESSION_PREFIX) && k.includes(urlSubstring)) {
        sessionStorage.removeItem(k);
      }
    }
  }
}

/** Clear all cached entries (e.g. on hard refresh). */
export function clearAll(): void {
  mem.clear();
  if (typeof sessionStorage !== "undefined") {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i) ?? "";
      if (k.startsWith(SESSION_PREFIX)) sessionStorage.removeItem(k);
    }
  }
}
