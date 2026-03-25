import React, { useEffect } from 'react';
import { useModalCachedFetch } from '../../../hooks/useModalCachedFetch';
import LabeledSelect from '../../../components/LabeledSelect';
import CheckRow from '../../../components/CheckRow';
import useLookup from '../../../hooks/useLookup';
import { useFormSeed } from '../../../hooks/useFormSeed';

const EMPTY = {
  crmCustomerTypeCode: '', crmCustomerType: '',
  crmProductCategoryCode: '', crmProductCategory: '',
  crmProductCode: '', crmProduct: '',
  inventoryPoolCode: '', inventoryPool: '',
  revenueStatisticCode: '', revenueStatistic: '',
  rosterCode: '', roster: '',
  salesStatisticCode: '', salesStatistic: '',
  deferralCalendarCode: '', deferralCalendar: '',
  customerPropertySetCode: '', customerPropertySet: '',
  revenueLocationOverrideCategoryCode: '', revenueLocationOverrideCategory: '',
  crmEvent: '', onlineHotlist: '', reportRevenue: '',
  printAcademyLabels: '', offlineFreeSell: '',
};

function ReadonlyField({ label, value }) {
  return (
    <div className="pc-field">
      <label className="pc-label">{label}</label>
      <input className="pc-input" value={value ?? ''} readOnly />
    </div>
  );
}

export default function PC_AdditionalTab({ productCode, isActive, form, update }) {

  const { options: crmCustomerTypes }     = useLookup('/api/lookups/crm-customer-types');
  const { options: crmProductCategories } = useLookup('/api/lookups/crm-product-categories');
  const { options: crmProducts }          = useLookup('/api/lookups/crm-products');
  const { options: inventoryPools }       = useLookup('/api/lookups/inventory-pools');
  const { options: revenueStatistics }    = useLookup('/api/lookups/revenue-statistics');
  const { options: rosters }              = useLookup('/api/lookups/rosters');
  const { options: salesStatistics }      = useLookup('/api/lookups/sales-statistics');
  const { options: deferralCalendars }    = useLookup('/api/lookups/deferral-calendars');
  const { options: customerPropertySets } = useLookup('/api/lookups/customer-property-sets');
  const { options: revenueLocationOverrideCategories } = useLookup('/api/lookups/revenue-location-override-categories');

  function bindSelect(baseKey, options) {
    const codeKey = `${baseKey}Code`;
    const labelKey = baseKey;
    return {
      value: String(form[codeKey] ?? ''),
      onChange: (e) => {
        const v = String(e?.target?.value ?? '');
        update(codeKey, v);
        const o = options.find((x) => String(x.value) === v);
        update(labelKey, o?.label ?? '');
      },
    };
  }

  const { data, loading, error } = useModalCachedFetch(
    `pc-additional-${productCode}`,
    async () => {
      const res = await fetch(`/api/product-components/${productCode}/additional`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { ...EMPTY, ...(json?.row ?? {}) };
    },
    !!productCode && isActive
  );


  // ✅ CENTRALIZED FORM SEEDING
  useFormSeed(data, update, [
    { key: 'crmCustomerTypeCode', transform: v => String(v ?? '') },
    { key: 'crmProductCategoryCode', transform: v => String(v ?? '') },
    { key: 'crmProductCode', transform: v => String(v ?? '') },
    { key: 'inventoryPoolCode', transform: v => String(v ?? '') },
    { key: 'revenueStatisticCode', transform: v => String(v ?? '') },
    { key: 'rosterCode', transform: v => String(v ?? '') },
    { key: 'salesStatisticCode', transform: v => String(v ?? '') },
    { key: 'deferralCalendarCode', transform: v => String(v ?? '') },
    { key: 'customerPropertySetCode', transform: v => String(v ?? '') },
    { key: 'revenueLocationOverrideCategoryCode', transform: v => String(v ?? '') },
    { key: 'crmEvent', transform: v => v === 'Y' },
    { key: 'onlineHotlist', transform: v => v === 'Y' },
    { key: 'reportRevenue', transform: v => v === 'Y' },
    { key: 'printAcademyLabels', transform: v => v === 'Y' },
    { key: 'offlineFreeSell', transform: v => v === 'Y' },
  ]);


  const row = data ?? EMPTY;

  if (!productCode) return <div className="p-3 text-sm text-gray-500">No product selected.</div>;
  if (loading) return <div className="p-3 text-sm">Loading Additional…</div>;
  if (error) return <div className="p-3 text-sm text-red-600">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Left Column */}
      <div className="space-y-4 pc-label-col-addl-left">
        <LabeledSelect
          label="CRM Customer Type"
          options={crmCustomerTypes}
          {...bindSelect('crmCustomerType', crmCustomerTypes)} />

        <LabeledSelect
          label="CRM Product Category"
          options={crmProductCategories}
          {...bindSelect('crmProductCategory', crmProductCategories)} />

        <LabeledSelect
          label="CRM Product"
          options={crmProducts}
          {...bindSelect('crmProduct', crmProducts)} />

        <LabeledSelect
          label="Inventory Pool"
          options={inventoryPools}
          {...bindSelect('inventoryPool', inventoryPools)} />

        <LabeledSelect
          label="Revenue Statistic"
          options={revenueStatistics}
          {...bindSelect('revenueStatistic', revenueStatistics)} />

        <LabeledSelect
          label="Roster"
          options={rosters}
          {...bindSelect('roster', rosters)} />

        <LabeledSelect
          label="Sales Statistic"
          options={salesStatistics}
          {...bindSelect('salesStatistic', salesStatistics)} />

        <LabeledSelect
          label="Deferral Calendar"
          options={deferralCalendars}
          {...bindSelect('deferralCalendar', deferralCalendars)} />
      </div>

      {/* Right Column */}
      <div className="space-y-4 pc-label-col-addl-right">
        <LabeledSelect
          label="Customer Property Set"
          options={customerPropertySets}
          {...bindSelect('customerPropertySet', customerPropertySets)} />

        <LabeledSelect
          label="Revenue Location Override Category"
          options={revenueLocationOverrideCategories}
          {...bindSelect('revenueLocationOverrideCategory', revenueLocationOverrideCategories)} />

        <div className="grid grid-cols-2 gap-4">
          <CheckRow
            label="CRM Event"
            checked={form.crmEvent ?? false}
            onChange={v => update('crmEvent', v)}
          />
          <CheckRow
            label="Online Hotlist"
            checked={form.onlineHotlist ?? false}
            onChange={v => update('onlineHotlist', v)}
          />
          <CheckRow
            label="Report Revenue"
            checked={form.reportRevenue ?? false}
            onChange={v => update('reportRevenue', v)}
          />
          <CheckRow
            label="Print Academy Labels"
            checked={form.printAcademyLabels ?? false}
            onChange={v => update('printAcademyLabels', v)}
          />
          <CheckRow
            label="Off-line Free Sell"
            checked={form.offlineFreeSell ?? false}
            onChange={v => update('offlineFreeSell', v)}
          />
        </div>
      </div>

    </div>
  );
}
