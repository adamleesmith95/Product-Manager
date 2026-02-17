import React from 'react';

export default function Checkbox({ label, checked, onChange, disabled }) {
  return (
    <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span>{label}</span>
    </label>
  );
}