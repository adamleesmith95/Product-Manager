import React, { useMemo } from 'react';
import DataTable from '../../../components/shared/DataTable';
import { useModalCachedFetch } from '../../../hooks/useModalCachedFetch';

const COMMON_TAIL = [
  { key: 'price',                 label: 'Price',                 sortable: true,   render: (v) => (v===null ? '' : Number(v).toFixed(2))},
  { key: 'price_allocation',      label: 'Price Alloc',           sortable: true},
  { key: 'discount_allocation',   label: 'Discount Alloc',        sortable: true },
  { key: 'commission_allocation', label: 'Commission Alloc',      sortable: true },
  { key: 'operator_id',           label: 'Operator ID',           sortable: true },
  { key: 'update_date',           label: 'Updated',               sortable: true },
];

const COLUMNS = {
  D: [
    { key: 'product',         label: 'Product',       sortable: true },
    { key: 'product_code',    label: 'Product Code',  sortable: true },
    { key: 'effective_date',  label: 'Effective',     sortable: true },
    { key: 'expiration_date', label: 'Expires',       sortable: true },
    ...COMMON_TAIL,
  ],
  S: [
    { key: 'product',              label: 'Product',             sortable: true },
    { key: 'product_code',         label: 'Product Code',        sortable: true },
    { key: 'pricing_season_code',  label: 'Season Code',         sortable: true },
    { key: 'pricing_season',       label: 'Pricing Season',      sortable: true },
    ...COMMON_TAIL,
  ],
  LD: [
    { key: 'sale_location',       label: 'Sale Location',        sortable: true },
    { key: 'sale_location_code',  label: 'Location Code',        sortable: true },
    { key: 'effective_date',      label: 'Effective',            sortable: true },
    { key: 'expiration_date',     label: 'Expires',              sortable: true },
    { key: 'product',             label: 'Product',              sortable: true },
    { key: 'product_code',        label: 'Product Code',         sortable: true },
    ...COMMON_TAIL,
  ],
  LS: [
    { key: 'sale_location',       label: 'Sale Location',        sortable: true },
    { key: 'sale_location_code',  label: 'Location Code',        sortable: true },
    { key: 'pricing_season_code', label: 'Season Code',          sortable: true },
    { key: 'pricing_season',      label: 'Pricing Season',       sortable: true },
    { key: 'product',             label: 'Product',              sortable: true },
    { key: 'product_code',        label: 'Product Code',         sortable: true },
    ...COMMON_TAIL,
  ],
};

const TYPE_LABELS = {
  D:  'Date Range',
  S:  'Season Range',
  LD: 'Date + Location',
  LS: 'Season + Location',
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function ProductPricingTab({ productPhc }) {
  const { data, loading, error } = useModalCachedFetch(
    `product-pricing-${productPhc}`,
    async () => {
      const res = await fetch(`${API_BASE}/api/products/${productPhc}/pricing`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    !!productPhc
  );

  const pricingType = data?.pricingType ?? null;
  const rows = data?.rows ?? [];
  const columns = COLUMNS[pricingType] ?? COLUMNS.D;

  if (!productPhc) {
    return <div className="text-sm text-neutral-500 p-2">No product selected.</div>;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <span className="text-xs text-neutral-500">Pricing type:</span>
        {pricingType ? (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
            {pricingType} — {TYPE_LABELS[pricingType]}
          </span>
        ) : loading ? (
          <span className="text-xs text-neutral-400">Loading…</span>
        ) : null}
        {error && (
          <span className="text-xs text-red-600 ml-2">Failed to load pricing data.</span>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <DataTable
          columns={columns}
          data={rows}
          rowKey="product_code"
          storageKey={`product-pricing-${pricingType ?? 'loading'}`}
          loading={loading}
          emptyMessage={loading ? '' : 'No pricing records found.'}
        />
      </div>
    </div>
  );
}