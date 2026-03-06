import React, { useEffect, useRef, useState } from 'react';

const EMPTY = {
  productCode: null,
  description: '',
  productCategory: '',
  displayOrder: null,
  productProfileType: '',
  units: '',
  salesUnits: '',
  active: '',
  display: '',
  changeRevenueLocation: '',
  paymentDate: '',
  reference: '',
  deferralPattern: '',
  operatorId: '',
  updateDate: '',
};

export default function PC_GeneralTab({ productCode, isActive }) {
  const [row, setRow] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loadedFor = useRef(null);

  useEffect(() => {
    if (!isActive || !productCode) return;
    if (loadedFor.current === productCode) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/product-components/${productCode}/general`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json?.row ?? EMPTY;
        setRow({ ...EMPTY, ...data });
        loadedFor.current = productCode;
      } catch (e) {
        if (e.name !== 'AbortError') setError('Failed to load General tab.');
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [isActive, productCode]);

  if (!productCode) return <div className="p-3 text-sm text-gray-500">No product selected.</div>;
  if (loading) return <div className="p-3 text-sm">Loading General…</div>;
  if (error) return <div className="p-3 text-sm text-red-600">{error}</div>;

  return (
    <div className="pc-grid-2">
      <ReadonlyField label="Product Code" value={row.productCode} />
      <ReadonlyField label="Description" value={row.description} />
      <ReadonlyField label="Product Category" value={row.productCategory} />
      <ReadonlyField label="Display Order" value={row.displayOrder} />
      <ReadonlyField label="Product Profile Type" value={row.productProfileType} />
      <ReadonlyField label="Units" value={row.units} />
      <ReadonlyField label="Sales Units" value={row.salesUnits} />
      <ReadonlyField label="Active" value={row.active} />
      <ReadonlyField label="Display" value={row.display} />
      <ReadonlyField label="Change Revenue Location" value={row.changeRevenueLocation} />
      <ReadonlyField label="Payment Date" value={row.paymentDate} />
      <ReadonlyField label="Reference" value={row.reference} />
      <ReadonlyField label="Deferral Pattern" value={row.deferralPattern} />
      <ReadonlyField label="Operator ID" value={row.operatorId} />
      <ReadonlyField label="Update Date" value={row.updateDate} />
    </div>
  );
}

function ReadonlyField({ label, value }) {
  return (
    <div className="pc-field">
      <label className="pc-label">{label}</label>
      <input className="pc-input" value={value ?? ''} readOnly />
    </div>
  );
}