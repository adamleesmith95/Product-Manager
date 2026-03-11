import { useEffect, useState } from 'react';
import { useModalSessionSafe } from '../context/ModalSessionContext';

export type Option = { value: string; label: string };

function toOption(row: any): Option {
  const value =
    row?.value ??
    row?.code ??
    row?.id ??
    row?.key ??
    '';

  const label =
    row?.label ??
    row?.description ??
    row?.name ??
    String(value);

  return { value: String(value), label: String(label) };
}

export default function useLookup(url: string) {
  const session = useModalSessionSafe();
  const cacheKey = `lookup:${url}`;

  const [options, setOptions] = useState<Option[]>(
    () => session?.getDataCache(cacheKey) ?? []
  );

  useEffect(() => {
    const cached = session?.getDataCache(cacheKey);
    if (cached?.length) {
      setOptions(cached);
      return;
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : (data?.rows ?? data?.options ?? []);
        const opts = rows.map(toOption);
        session?.setDataCache(cacheKey, opts);
        setOptions(opts);
      })
      .catch(() => {});
  }, [url, session, cacheKey]);

  return { options };
}