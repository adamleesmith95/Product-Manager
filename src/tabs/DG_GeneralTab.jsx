import React from 'react';
import { useModalCachedFetch } from '../hooks/useModalCachedFetch';

const EMPTY = {
  code: '',
  description: '',
  active: '',
  displayOrder: '',
  operatorId: '',
  updated: '',
};

function ReadonlyField({ label, value }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-600">{label}</label>
      <input
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-50"
        value={value ?? ''}
        readOnly
      />
    </div>
  );
}

export default function DG_GeneralTab({ groupCode, isActive }) {
  const { data, loading, error } = useModalCachedFetch(
    `dg-general-${groupCode}`,
    async () => {
      const res = await fetch(`/api/display-groups/${groupCode}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { ...EMPTY, ...(json?.row ?? {}) };
    },
    !!groupCode && isActive
  );

  const row = data ?? EMPTY;

  if (!groupCode) return <div className="p-3 text-sm text-gray-500">No display group selected.</div>;
  if (loading) return <div className="p-3 text-sm">Loading…</div>;
  if (error) return <div className="p-3 text-sm text-red-600">{String(error)}</div>;

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      <ReadonlyField label="Display Group Code" value={row.code} />
      <ReadonlyField label="Description" value={row.description} />
      <ReadonlyField label="Active" value={row.active} />
      <ReadonlyField label="Display Order" value={row.displayOrder} />
      <ReadonlyField label="Operator ID" value={row.operatorId} />
      <ReadonlyField label="Updated" value={row.updated} />
    </div>
  );
}