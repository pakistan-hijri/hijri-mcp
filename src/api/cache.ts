/** Process-local TTL cache with in-flight request deduplication. */

export interface Cache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs: number): void;
  getOrLoad<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T>;
}

export interface CacheOptions {
  now?: () => number;
}

interface Entry {
  value: unknown;
  expiresAt: number;
}

export function createCache(options: CacheOptions = {}): Cache {
  const now = options.now ?? Date.now;
  const values = new Map<string, Entry>();
  const inFlight = new Map<string, Promise<unknown>>();

  function get<T>(key: string): T | undefined {
    const entry = values.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now()) {
      values.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  function set<T>(key: string, value: T, ttlMs: number): void {
    values.set(key, { value, expiresAt: now() + ttlMs });
  }

  async function getOrLoad<T>(
    key: string,
    ttlMs: number,
    load: () => Promise<T>,
  ): Promise<T> {
    const cached = get<T>(key);
    if (cached !== undefined) return cached;

    const pending = inFlight.get(key);
    if (pending) return pending as Promise<T>;

    const promise = (async () => {
      const value = await load();
      set(key, value, ttlMs);
      return value;
    })().finally(() => {
      inFlight.delete(key);
    });

    inFlight.set(key, promise);
    return promise;
  }

  return { get, set, getOrLoad };
}
