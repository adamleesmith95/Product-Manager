import React from 'react';
import { useModalCachedFetch } from '../hooks/useModalCachedFetch';

const EMPTY = {
  productCode: null, description: '', productCategory: '',
  displayOrder: null, productProfileType: '', units: '',
  salesUnits: '', active: '', display: '', changeRevenueLocation: '',
  paymentDate: '', reference: '', deferralPattern: '', operatorId: '', updateDate: '',
};

export default function PC_GeneralTab({ productCode, isActive }) {
  const { data, loading, error } = useModalCachedFetch(
    `pc-general-${productCode}`,
    async () => {
      const res = await fetch(`/api/product-components/${productCode}/general`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { ...EMPTY, ...(json?.row ?? {}) };
    },
    !!productCode && isActive
  );

  const row = data ?? EMPTY;

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