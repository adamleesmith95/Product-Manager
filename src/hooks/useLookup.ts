import { useEffect, useState } from 'react';

export type Option = { value: string; label: string };

export default function useLookup(endpoint: string) {
  const [options, setOptions] = useState<Option[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError('');
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const opts = (data.rows || []).map((r: any) => ({
          value: r.code,
          label: r.label,
        }));
        if (alive) setOptions(opts);
      } catch (e: any) {
        if (alive) {
          console.error(`Failed to load ${endpoint}`, e);
          setError(e?.message || 'Lookup failed');
          setOptions([]); // keep controlled
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [endpoint]);

  return { options, error };
}