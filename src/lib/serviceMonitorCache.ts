/**
 * serviceMonitorCache.ts
 *
 * Shared in-memory cache for ServiceMonitorView API calls.
 *
 * Problem solved: when navigating between AI service pages (Helmet Detection →
 * Restricted Area → Age Gender), each page mounts its own component and fires
 * an independent fetch to /customer/service-monitor/{id}/dashboard as well as
 * /customer/dashboard — resulting in duplicate requests visible in DevTools.
 *
 * Solution: a Promise-level dedup cache with a 30-second TTL.
 * - First caller fetches and caches the Promise.
 * - Any concurrent or subsequent caller within the TTL receives the same Promise.
 * - After TTL expires the entry is evicted so the next call re-fetches.
 * - If the fetch fails the entry is evicted immediately (no negative caching).
 * - Manual invalidation is exposed for Refresh buttons.
 */

interface CacheEntry<T> {
  promise: Promise<T>;
  expiresAt: number;
  timer: ReturnType<typeof setTimeout>;
}

const TTL_MS = 30_000; // 30 seconds

class PromiseCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = this.store.get(key);

    if (hit && hit.expiresAt > now) {
      return hit.promise as Promise<T>;
    }

    // Evict stale entry if present
    if (hit) {
      clearTimeout(hit.timer);
      this.store.delete(key);
    }

    const promise = fetcher().catch((err) => {
      // Evict on error so next call retries
      this.evict(key);
      throw err;
    }) as Promise<T>;

    const timer = setTimeout(() => this.store.delete(key), TTL_MS);

    this.store.set(key, {
      promise: promise as Promise<unknown>,
      expiresAt: now + TTL_MS,
      timer,
    });

    return promise;
  }

  evict(key: string) {
    const hit = this.store.get(key);
    if (hit) {
      clearTimeout(hit.timer);
      this.store.delete(key);
    }
  }

  evictPrefix(prefix: string) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.evict(key);
    }
  }

  clear() {
    for (const key of this.store.keys()) this.evict(key);
  }
}

export const serviceMonitorCache = new PromiseCache();

/**
 * Build the canonical cache key for a service monitor dashboard request.
 * Must match the query params sent by ServiceMonitorView.
 */
export function serviceMonitorKey(
  serviceApiId: number,
  from: string,
  to: string,
  branchId: string
): string {
  return `svc:${serviceApiId}:${from}:${to}:${branchId}`;
}

/**
 * Invalidate all cached entries for a given service (e.g. on Refresh click).
 */
export function invalidateService(serviceApiId: number) {
  serviceMonitorCache.evictPrefix(`svc:${serviceApiId}:`);
}
