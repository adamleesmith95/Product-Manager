
// src/components/Breadcrumbs.tsx
import { useMemo } from 'react';
import { routes } from '../routes';

export default function Breadcrumbs({ pathname }: { pathname: string }) {
  const current = useMemo(
    () => routes.find((r) => r.path === pathname),
    [pathname]
  );

  return (
    <div className="px-4 py-3 text-sm text-neutral-700 flex items-center gap-2">
      <span className="text-blue-900 font-medium">PRODUCT MANAGER</span>
      <span>/</span>
      <span>{current?.section ?? '—'}</span>
      {current?.title && (
        <>
          <span>/</span>
          <span className="font-medium">{current.title}</span>
        </>
      )}
    </div>
  );
}
