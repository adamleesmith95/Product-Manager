import React, { useEffect, useRef, useState } from 'react';

const EMPTY = {
  crmCustomerType: '',
  crmProductCategory: '',
  crmProduct: '',
  inventoryPool: '',
  revenueStatistic: '',
  roster: '',
  salesStatistic: '',
  deferralCalendar: '',
  customerPropertySet: '',
  crmEvent: '',
  onlineHotlist: '',
  reportRevenue: '',
  printAcademyLabels: '',
  offlineFreeSell: '',
  revenueLocationOverrideCategory: '',
};

function ReadonlyField({ label, value }) {
  return (
    <div className="pc-field">
      <label className="pc-label">{label}</label>
      <input className="pc-input" value={value ?? ''} readOnly />
    </div>
  );
}

export default function PC_AdditionalTab({ productCode, isActive }) {
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
        const res = await fetch(`/api/product-components/${productCode}/additional`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json?.row ?? EMPTY;
        setRow({ ...EMPTY, ...data });
        loadedFor.current = productCode;
      } catch (e) {
        if (e.name !== 'AbortError') setError('Failed to load Additional tab.');
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [isActive, productCode]);

  if (!productCode) return <div className="p-3 text-sm text-gray-500">No product selected.</div>;
  if (loading) return <div className="p-3 text-sm">Loading Additional…</div>;
  if (error) return <div className="p-3 text-sm text-red-600">{error}</div>;

  return (
    <div className="pc-grid-2">
      <ReadonlyField label="CRM Customer Type" value={row.crmCustomerType} />
      <ReadonlyField label="CRM Product Category" value={row.crmProductCategory} />
      <ReadonlyField label="CRM Product" value={row.crmProduct} />
      <ReadonlyField label="Inventory Pool" value={row.inventoryPool} />
      <ReadonlyField label="Revenue Statistic" value={row.revenueStatistic} />
      <ReadonlyField label="Roster" value={row.roster} />
      <ReadonlyField label="Sales Statistic" value={row.salesStatistic} />
      <ReadonlyField label="Deferral Calendar" value={row.deferralCalendar} />
      <ReadonlyField label="Customer Property Set" value={row.customerPropertySet} />
      <ReadonlyField label="CRM Event" value={row.crmEvent} />
      <ReadonlyField label="Online Hotlist" value={row.onlineHotlist} />
      <ReadonlyField label="Report Revenue" value={row.reportRevenue} />
      <ReadonlyField label="Print Academy Labels" value={row.printAcademyLabels} />
      <ReadonlyField label="Off-line Free Sell" value={row.offlineFreeSell} />
      <ReadonlyField label="Revenue Location Override Category" value={row.revenueLocationOverrideCategory} />
    </div>
  );
}