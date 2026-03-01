import { useEffect, useRef, useState } from 'react';

export function useBrowserData<T>(
  deps: ReadonlyArray<unknown>,
  loader: (signal: AbortSignal) => Promise<T>
) {
  const seqRef = useRef(0);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const seq = ++seqRef.current;
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    loader(ac.signal)
      .then((result) => {
        if (seq !== seqRef.current) return;
        setData(result);
      })
      .catch((e) => {
        if ((e as any)?.name === 'AbortError') return;
        if (seq !== seqRef.current) return;
        setError(e);
      })
      .finally(() => {
        if (seq !== seqRef.current) return;
        setLoading(false);
      });

    return () => ac.abort();
  }, deps); // intentional

  return { data, loading, error };
}