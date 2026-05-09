const memory = new Map<string, { data: unknown; expiry: number }>();
const inFlight = new Map<string, Promise<any>>();

const SS_KEY = 'gestionar_cache_v1';

function ssGet(): Record<string, { data: unknown; expiry: number }> {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function ssSet(entries: Record<string, { data: unknown; expiry: number }>) {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage full or disabled — ignore
  }
}

function ssCleanup() {
  const now = Date.now();
  const entries = ssGet();
  const filtered: Record<string, { data: unknown; expiry: number }> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (v.expiry > now) filtered[k] = v;
  }
  ssSet(filtered);
}

ssCleanup();

export function cacheGet<T>(key: string): T | null {
  // memory first (most recent)
  const memEntry = memory.get(key);
  if (memEntry && Date.now() <= memEntry.expiry) {
    return memEntry.data as T;
  }
  if (memEntry) memory.delete(key);

  // sessionStorage fallback
  const entries = ssGet();
  const ssEntry = entries[key];
  if (ssEntry && Date.now() <= ssEntry.expiry) {
    const data = ssEntry.data as T;
    // promote to memory
    memory.set(key, ssEntry);
    return data;
  }
  if (ssEntry) {
    const filtered = { ...entries };
    delete filtered[key];
    ssSet(filtered);
  }

  return null;
}

export function cacheSet<T>(key: string, data: T, ttlMs = 30000): void {
  const entry = { data, expiry: Date.now() + ttlMs };
  memory.set(key, entry);

  const entries = ssGet();
  entries[key] = entry;
  ssSet(entries);
}

export function cacheDelete(key: string): void {
  memory.delete(key);
  const entries = ssGet();
  delete entries[key];
  ssSet(entries);
}

export function cacheDeletePrefix(prefix: string): void {
  memory.forEach((_, k) => { if (k.startsWith(prefix)) memory.delete(k); });
  const entries = ssGet();
  const filtered = Object.fromEntries(
    Object.entries(entries).filter(([k]) => !k.startsWith(prefix))
  );
  ssSet(filtered);
}

export function cacheClear(): void {
  memory.clear();
  ssSet({});
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

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher().then((data) => {
    cacheSet(key, data, ttlMs);
    inFlight.delete(key);
    return data;
  }).catch((err) => {
    inFlight.delete(key);
    throw err;
  });

  inFlight.set(key, promise);
  return promise;
}