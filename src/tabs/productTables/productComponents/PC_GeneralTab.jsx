import React, { useEffect } from 'react';
import { useModalCachedFetch } from '../../../hooks/useModalCachedFetch';
import LabeledInput from '../../../components/LabeledInput';
import LabeledSelect from '../../../components/LabeledSelect';
import LabeledDateInput from '../../../components/LabeledDateInput';
import CheckRow from '../../../components/CheckRow';
import useLookup from '../../../hooks/useLookup';
import { useFormSeed , asBoolean } from '../../../hooks/useFormSeed';

const EMPTY = {
  productCode: null, description: '', productCategory: '',
  displayOrder: null, productProfileType: '', units: '',
  salesUnits: '', active: '', display: '', changeRevenueLocation: '',
  paymentDate: '', reference: '', deferralPattern: '', operatorId: '', updateDate: '',
};

export default function PC_GeneralTab({ productCode, isActive, form, update }) {

const { options: productCategories } = useLookup('/api/lookups/product-categories');
const { options: productProfileTypes } = useLookup('/api/lookups/product-profile-types');
const { options: deferralPatterns } = useLookup('/api/lookups/deferral-patterns');

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
    `pc-general-${productCode}`,
    async () => {
      const res = await fetch(`/api/product-components/${productCode}/general`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { ...EMPTY, ...(json?.row ?? {}) };
    },
    !!productCode && isActive
  );

  // ✅ CENTRALIZED FORM SEEDING
  /* Commented out 3/28/26 for the below
  useFormSeed(data, update, [
    { key: 'productCategoryCode', transform: v => String(v ?? '') },
    { key: 'productProfileTypeCode', transform: v => String(v ?? '') },
    { key: 'deferralPatternCode', transform: v => String(v ?? '') },
    { key: 'active', transform: v => v === 'Y' },
    { key: 'display', transform: v => v === 'Y' },
    { key: 'changeRevenueLocation', transform: v => v === 'Y' },
  ]);
  */
 /* Added 3/28/26*/
   useFormSeed(data, update, [
    { key: 'productCategoryCode' },
    { key: 'productProfileTypeCode' },
    { key: 'deferralPatternCode' },
    { key: 'active',                transform: asBoolean },
    { key: 'display',               transform: asBoolean },
    { key: 'changeRevenueLocation', transform: asBoolean },
  ]);
   /* End of Added 3/28/26*/

  const row = data ?? EMPTY;

  if (!productCode) return <div className="p-3 text-sm text-gray-500">No product selected.</div>;
  if (loading) return <div className="p-3 text-sm">Loading General…</div>;
  if (error) return <div className="p-3 text-sm text-red-600">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Left Column */}
        <div className="space-y-4 pc-label-col-general-left">
          <ReadonlyField label="Product Code" value={row.productCode} />
          <ReadonlyField label="Description" value={row.description} />

          <LabeledSelect
            label="Product Category"
            options={productCategories}
            {...bindSelect('productCategory', productCategories)} />

          <ReadonlyField label="Display Order" value={row.displayOrder} />

          <LabeledSelect
            label="Product Profile Type"
            options={productProfileTypes}
            {...bindSelect('productProfileType', productProfileTypes)} />

          <div className="grid grid-cols-2 gap-4">
          <ReadonlyField label="Units" value={row.units} />
          <ReadonlyField label="Sales Units" value={row.salesUnits} />   
          </div>
          <div className="grid grid-cols-2 gap-4">
          <ReadonlyField label="Operator ID" value={row.operatorId} />
          <ReadonlyField label="Update Date" value={row.updateDate} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 pc-label-col-general-right">
          <div className="grid grid-cols-3 gap-4">
            <CheckRow
              label="Active"
              checked={form.active ?? false}
              onChange={v => update('active', v)}
            />
            <CheckRow
              label="Display"
              checked={form.display ?? false}
              onChange={v => update('display', v)}
            />
            <CheckRow
              label="Change Revenue Location"
              checked={form.changeRevenueLocation ?? false}
              onChange={v => update('changeRevenueLocation', v)}
            />
          </div>

          <div className="flex justify-center">
            <button
              className="btn btn-light"
              type="button"
              onClick={() => {/* TODO: open PHC modal */}}
            >
              View PHC
            </button>
          </div>

            

          <ReadonlyField label="Payment Date" value={row.paymentDate} />
          <ReadonlyField label="Reference" value={row.reference} />

          <LabeledSelect
            label="Deferral Pattern"
            options={deferralPatterns}
            {...bindSelect('deferralPattern', deferralPatterns)} />

        </div>

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