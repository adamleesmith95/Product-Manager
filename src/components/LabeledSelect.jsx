import React from 'react';

export default function LabeledSelect({ label, options, value, onChange, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block">{label}</span>
      <select
        value={value ?? ''}
        onChange={onChange}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Select --</option>
        {options.map(opt =>
          typeof opt === 'string' ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
    </label>
  );
}
