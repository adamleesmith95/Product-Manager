import React, { useEffect, useState } from 'react';
import { useModalCachedFetch } from '../../../hooks/useModalCachedFetch';
import LabeledInput from '../../../components/LabeledInput';
import LabeledSelect from '../../../components/LabeledSelect';
import LabeledDateInput from '../../../components/LabeledDateInput';
import CheckRow from '../../../components/CheckRow';
import useLookup from '../../../hooks/useLookup';
import { useFormSeed , asBoolean , asNumber} from '../../../hooks/useFormSeed';
import EntityRelationViewerModal from '../../../components/shared/EntityRelationViewerModal';
import { useEntityRelationViewer } from '../../../hooks/useEntityRelationViewer';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';

const EMPTY = {
  productCode: null, description: '', productCategory: '',
  displayOrder: null, productProfileType: '', units: '',
  salesUnits: '', active: '', display: '', changeRevenueLocation: '',
  paymentDate: '', reference: '', deferralPattern: '', operatorId: '', updateDate: '',
};

const PHC_COLUMNS = [
  { key: 'productHeaderCode', label: 'Product Header Code', width: 100, minWidth: 40, className: 'whitespace-nowrap' },
  { key: 'productHeaderDescription', label: 'Product Header Description', width: 200, minWidth: 100, className: 'whitespace-nowrap' },
  { key: 'productHeaderActive', label: 'Product Header Active', width: 100, minWidth: 40, className: 'whitespace-nowrap' },
  { key: 'productCode', label: 'Product Code', width: 100, minWidth: 40, className: 'whitespace-nowrap' },
  { key: 'productDescription', label: 'Product Description', width: 200, minWidth: 100, className: 'whitespace-nowrap' },
  { key: 'productActive', label: 'Product Active', width: 100, minWidth: 40, className: 'whitespace-nowrap' },
];

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
    { key: 'paymentDate' },
  ]);
   /* End of Added 3/28/26*/

  const row = data ?? EMPTY;

  const phcViewer = useEntityRelationViewer(`/api/product-components/${productCode}/phcs`);
  

  if (!productCode) return <div className="p-3 text-sm text-gray-500">No product selected.</div>;
  if (loading) return <div className="p-3 text-sm">Loading General…</div>;
  if (error) return <div className="p-3 text-sm text-red-600">{error}</div>;

  return (
    <>
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
              onClick={() => phcViewer.openViewer()}
            >
              View PHC
            </button>
          </div>

            

          
          <LabeledDateInput
                    label="Payment Date"
                    value={form.paymentDate ?? ''}
                    onChange={(v) => update('paymentDate', v)}
                  />

          <ReadonlyField label="Reference" value={row.reference} />

          <LabeledSelect
            label="Deferral Pattern"
            options={deferralPatterns}
            {...bindSelect('deferralPattern', deferralPatterns)} />

        </div>

      </div>

            <EntityRelationViewerModal
        open={phcViewer.open}
        onClose={phcViewer.closeViewer}
        title={`PHCs Linked To Product Component (${productCode ?? ''})`}
        columns={PHC_COLUMNS}
        rows={phcViewer.rows}
        loading={phcViewer.loading}
        error={phcViewer.error}
        emptyMessage="No PHCs are linked to this component."
        storageKey="relation-phc-for-component"
        getRowActions={buildPhcActions}
      />
      </>
  );
}

function buildPhcActions(phcRow) {
  const phcCode = String(phcRow?.productHeaderCode ?? '');
  const categoryCode = String(phcRow?.displayCategoryCode ?? '');

    console.log('[PC_GeneralTab] open-phc-new-tab', {
    phcCode,
    categoryCode,
    row: phcRow,
  });

  if (!phcCode) return [];

  return [
    {
      key: 'open-phc-new-tab',
      //label: 'Open PHC In New Tab',
      
label: (
      <span className="flex items-center gap-2">
        
        <span>Go To Products for Sale</span>
        <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-500" />
      </span>
    ),

      
      onClick: () => {
        const params = new URLSearchParams();
        if (categoryCode) params.set('focusCategoryCode', categoryCode);
        params.set('focusPhcCode', phcCode);
        params.set('navTs', String(Date.now()));
        window.open(`/product-manager/manage-products-for-sale?${params.toString()}`, '_blank');
      },
    },
  ];
}


function ReadonlyField({ label, value }) {
  return (
    <div className="pc-field">
      <label className="pc-label">{label}</label>
      <input className="pc-input" value={value ?? ''} readOnly />
    </div>
  );
}