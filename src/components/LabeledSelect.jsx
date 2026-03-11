import React from 'react';

export default function LabeledSelect({ label, options = [], value, onChange, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">-- Select --</option>
        {options.map((opt, i) => (
          <option key={`${opt.value ?? ''}-${i}`} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
