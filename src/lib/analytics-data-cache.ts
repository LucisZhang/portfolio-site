type CacheEntry = {
  ready: boolean;
  value?: unknown;
  promise: Promise<unknown>;
};

type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

type AnalyticsWarmOptions = {
  startAfterMs?: number;
  idleTimeoutMs?: number;
};

const normalizedDatasetCache = new Map<string, CacheEntry>();

export type AnalyticsDatasetCacheState = "missing" | "loading" | "ready";

/**
 * Shares one normalized dataset materialization across analytics mounts and source switches.
 * Rejected work is evicted so a missing or invalid artifact can be retried without weakening the
 * fail-closed path.
 */
export function materializeAnalyticsDataset<T>(key: string, materialize: () => Promise<T>): Promise<T> {
  const cached = normalizedDatasetCache.get(key);
  if (cached) return cached.promise as Promise<T>;

  const entry: CacheEntry = { ready: false, promise: Promise.resolve() };
  const promise = Promise.resolve()
    .then(materialize)
    .then((value) => {
      entry.ready = true;
      entry.value = value;
      return value;
    })
    .catch((error: unknown) => {
      if (normalizedDatasetCache.get(key) === entry) normalizedDatasetCache.delete(key);
      throw error;
    });
  entry.promise = promise;
  normalizedDatasetCache.set(key, entry);
  return promise;
}

export function peekAnalyticsDataset<T>(key: string): T | null {
  const cached = normalizedDatasetCache.get(key);
  return cached?.ready ? cached.value as T : null;
}

export function getAnalyticsDatasetCacheState(key: string): AnalyticsDatasetCacheState {
  const cached = normalizedDatasetCache.get(key);
  if (!cached) return "missing";
  return cached.ready ? "ready" : "loading";
}

/**
 * Warms an inactive analytics source after the browser has yielded the initial render. Calling the
 * source before idle simply joins the same cached promise, so the interaction never starts a
 * second fetch, DuckDB query, or normalization pass.
 */
export function scheduleAnalyticsDatasetWarm<T>(
  key: string,
  warmDataset: () => Promise<T>,
  options: AnalyticsWarmOptions = {},
) {
  if (normalizedDatasetCache.has(key) || typeof window === "undefined") return () => undefined;

  const idleWindow = window as IdleCapableWindow;
  let cancelled = false;
  let idleHandle: number | undefined;
  let timerHandle: number | undefined;
  const warm = () => {
    if (cancelled) return;
    void warmDataset().catch(() => {
      // A warm-up failure is intentionally silent. The requested-source path owns the explicit
      // pending/blocked UI and will retry because rejected cache entries are evicted above.
    });
  };

  const scheduleAfterYield = () => {
    if (cancelled) return;
    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(warm, { timeout: options.idleTimeoutMs ?? 1_500 });
      return;
    }
    timerHandle = window.setTimeout(warm, 80);
  };

  if ((options.startAfterMs ?? 0) > 0) timerHandle = window.setTimeout(scheduleAfterYield, options.startAfterMs);
  else scheduleAfterYield();

  return () => {
    cancelled = true;
    if (timerHandle !== undefined) window.clearTimeout(timerHandle);
    if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
  };
}
