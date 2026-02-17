import React from 'react';

export default function Section({ title, children, className = '' }) {
  return (
    <section className={`mb-6 ${className}`}>
      <h2 className="text-base font-semibold text-gray-800 mb-2">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}