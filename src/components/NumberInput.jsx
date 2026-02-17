import React from 'react';

export default function NumberInput({ value, onChange, min, max, step = 1, ...props }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value === '' ? '' : Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      placeholder=""
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  );
}