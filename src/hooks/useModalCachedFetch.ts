import { useEffect, useState } from 'react';
import { useModalSession } from '../context/ModalSessionContext';

export function useModalCachedFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  enabled = true
) {
  const { getDataCache, setDataCache } = useModalSession();
  const cached = getDataCache(cacheKey) as T | undefined;

  const [data, setData] = useState<T | undefined>(cached);
  const [loading, setLoading] = useState(!cached && enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (getDataCache(cacheKey)) {
      setData(getDataCache(cacheKey));
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchFn()
      .then(result => {
        setDataCache(cacheKey, result);
        setData(result);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [cacheKey, enabled]);

  return { data, loading, error };
}