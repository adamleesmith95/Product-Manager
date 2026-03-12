import React from 'react';

export type RowAction = {
  key: string;
  label: string;
  onClick: () => void;
};

export default function RowContextMenu({
  x, y, actions,
}: { x: number; y: number; actions: RowAction[] }) {
  return (
    <div className="fixed z-[1000] min-w-[160px] rounded border border-gray-300 bg-white shadow-md" style={{ left: x, top: y }}>
      {actions.map((a) => (
        <button key={a.key} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={a.onClick}>
          {a.label}
        </button>
      ))}
    </div>
  );
}