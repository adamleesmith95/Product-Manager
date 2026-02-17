import React from 'react';

export default function CheckRow({ label, checked, onChange, className = '' }) {
  return (
    <label className={`flex items-center gap-2 text-sm ${className}`}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={e => onChange(e.target.checked)}
        className="rounded border-neutral-300 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}