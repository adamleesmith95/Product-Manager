// src/components/LabeledDateInput.tsx
import React from 'react';
import { toDateInput, fromDateInput } from '../utils/dates';

type Props = {
  label: string;
  value: string | Date | null | undefined;
  onChange: (isoDate: string) => void; // store ISO 'YYYY-MM-DD' (or '')
  className?: string;
};

export default function LabeledDateInput({ label, value, onChange, className = '' }: Props) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block">{label}</span>
      <input
        type="date"
        value={toDateInput(value)}
        onChange={(e) => onChange(fromDateInput(e.target.value))}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}
