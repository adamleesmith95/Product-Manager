import { useEffect, useState } from 'react';
import { useModalSessionSafe } from '../context/ModalSessionContext';

export type Option = { value: string; label: string };

export default function useLookup(url: string) {
  // safe version returns nulls if no provider present
  const session = useModalSessionSafe();

  const [options, setOptions] = useState<Option[]>(
    () => session?.getDataCache(`lookup:${url}`) ?? []
  );

  useEffect(() => {
    const cached = session?.getDataCache(`lookup:${url}`);
    if (cached) { setOptions(cached); return; }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const opts = Array.isArray(data) ? data : (data?.rows ?? data?.options ?? []);
        session?.setDataCache(`lookup:${url}`, opts);
        setOptions(opts);
      })
      .catch(() => {});
  }, [url]);

  return { options };
}