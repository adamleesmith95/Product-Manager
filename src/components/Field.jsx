import React from 'react';

export default function Field({ label, children, hint }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <div className="text-xs text-gray-500">{hint}</div>}
    </div>
  );
}