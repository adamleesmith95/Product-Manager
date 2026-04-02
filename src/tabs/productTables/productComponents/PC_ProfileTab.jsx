import React, { useEffect } from 'react';
import { useModalCachedFetch } from '../../../hooks/useModalCachedFetch';
import LabeledSelect from '../../../components/LabeledSelect';
import LabeledInput from '../../../components/LabeledInput';
import LabeledDateInput from '../../../components/LabeledDateInput';
import CheckRow from '../../../components/CheckRow';
import useLookup from '../../../hooks/useLookup';
import { useFormSeed, asBoolean, asNumber } from '../../../hooks/useFormSeed';

const EMPTY = {
  liftProductTypeCode: '',    liftProductType: '',
  scanProcessOrderCode: '',   scanProcessOrder: '',
  liftScanTypeCode: '',       liftScanType: '',
  liftChargeInd: '',
  loadToMediaInd: '',
  liftEffectiveDate: '',
  expirationType: '',
  expirationDays: null,
  expirationDate: '',
};

function ReadonlyField({ label, value }) {
  return (
    <div className="pc-field">
      <label className="pc-label">{label}</label>
      <input className="pc-input" value={value ?? ''} readOnly />
    </div>
  );
}

export default function PC_ProfileTab({ productCode, isActive, form, update }) {

  const { options: liftProductTypes }   = useLookup('/api/lookups/lift-product-types');
  const { options: scanProcessOrders }  = useLookup('/api/lookups/scan-process-orders');
  const { options: liftScanTypes }      = useLookup('/api/lookups/lift-scan-types');
  //const { options: expirationTypes }    = useLookup('/api/lookups/expiration-types');
  const EXPIRATION_TYPES = [
    { value: 'D', label: 'Days' },
    { value: 'T', label: 'Date' },
  ];

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
    `pc-profile-${productCode}`,
    async () => {
      const res = await fetch(`/api/product-components/${productCode}/profile`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { ...EMPTY, ...(json?.row ?? {}) };
    },
    !!productCode && isActive
  );

  useFormSeed(data, update, [
    { key: 'liftProductTypeCode' },
    { key: 'scanProcessOrderCode' },
    { key: 'liftScanTypeCode' },
    { key: 'liftChargeInd',   transform: asBoolean },
    { key: 'loadToMediaInd',  transform: asBoolean },
    { key: 'liftEffectiveDate' },
    { key: 'expirationType' },
    { key: 'expirationDays',  transform: asNumber },
    { key: 'expirationDate' },
  ]);

  const row = data ?? EMPTY;

  if (!productCode) return <div className="p-3 text-sm text-gray-500">No product selected.</div>;
  if (loading)      return <div className="p-3 text-sm">Loading Profile…</div>;
  if (error)        return <div className="p-3 text-sm text-red-600">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Left Column */}
      <div className="space-y-4 pc-label-col-profile-left">

        <LabeledSelect
          label="Lift Product Type"
          options={liftProductTypes}
          {...bindSelect('liftProductType', liftProductTypes)}
        />

        <LabeledSelect
          label="Scan Process Order"
          options={scanProcessOrders}
          {...bindSelect('scanProcessOrder', scanProcessOrders)}
        />

        <LabeledSelect
          label="Scan Type"
          options={liftScanTypes}
          {...bindSelect('liftScanType', liftScanTypes)}
        />

        <LabeledSelect
          label="Expiration Type"
          options={EXPIRATION_TYPES}
          value={String(form.expirationType ?? '')}
          onChange={(e) => update('expirationType', String(e?.target?.value ?? ''))}
        />

        <LabeledDateInput
          label="Effective Date"
          value={form.liftEffectiveDate ?? ''}
          onChange={(v) => update('liftEffectiveDate', v)}
        />

      </div>

      {/* Right Column */}
      <div className="space-y-4 pc-label-col-profile-right">

        <div className="grid grid-cols-2 gap-4">
          <CheckRow
            label="Lift Charge"
            checked={form.liftChargeInd ?? false}
            onChange={v => update('liftChargeInd', v)}
          />
          <CheckRow
            label="Load to Media"
            checked={form.loadToMediaInd ?? false}
            onChange={v => update('loadToMediaInd', v)}
          />
        </div>

        <div className="flex justify-center">
          <button
            className="btn btn-light"
            type="button"
            onClick={() => {/* TODO: open Modify modal */}}
          >
            Modify
          </button>
        </div>

        <LabeledInput
          label="Expiration Days"
          type="number"
          value={form.expirationDays ?? ''}
          onChange={(v) => update('expirationDays', v === '' ? null : Number(v))}
        />

        <LabeledDateInput
          label="Expiration Date"
          value={form.expirationDate ?? ''}
          onChange={(v) => update('expirationDate', v)}
        />

      </div>

    </div>
  );
}
