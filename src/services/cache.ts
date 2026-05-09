const store = new Map<string, { data: unknown; expiry: number }>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs = 30000): void {
  store.set(key, { data, expiry: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function cacheClear(): void {
  store.clear();
}

export function cacheKey(prefix: string, params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params || Object.keys(params).length === 0) return prefix;
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${prefix}?${filtered}`;
}

export function cachedApiCall<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30000
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return Promise.resolve(cached);
  return fetcher().then((data) => {
    cacheSet(key, data, ttlMs);
    return data;
  });
}