import React from 'react';

export default function LabeledInput({ label, value, onChange, type = 'text', className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}