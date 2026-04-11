import { useEffect, useState } from 'react';
import { useModalSession } from '../context/ModalSessionContext';

// Module-level: shared across all hook invocations
const inFlight = new Map<string, Promise<any>>();

export function useModalCachedFetch<T>(cacheKey, fetchFn, enabled = true) {
  const { getDataCache, setDataCache } = useModalSession();
  const cached = getDataCache(cacheKey) as T | undefined;
  const [data, setData] = useState<T | undefined>(cached);
  const [loading, setLoading] = useState(!cached && enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const hit = getDataCache(cacheKey);
    if (hit) { setData(hit as T); setLoading(false); return; }

    setLoading(true);
    // Reuse any already-in-flight request for this key
    let pending = inFlight.get(cacheKey) as Promise<T> | undefined;
    if (!pending) {
      pending = fetchFn().then(result => {
        setDataCache(cacheKey, result);
        inFlight.delete(cacheKey);
        return result;
      });
      pending.catch(() => inFlight.delete(cacheKey));
      inFlight.set(cacheKey, pending);
    }
    pending
      .then(result => setData(result))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [cacheKey, enabled]);

  return { data, loading, error };
}