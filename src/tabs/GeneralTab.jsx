
import React from 'react';
import LabeledInput from '../components/LabeledInput';
import LabeledSelect from '../components/LabeledSelect';
import LabeledDateInput from '../components/LabeledDateInput';
import CheckRow from '../components/CheckRow';
import useLookup from '../hooks/useLookup';






export default function GeneralTab({ form, update }) {

const { options: displayCategories } = useLookup('/api/lookups/display-categories');
const { options: primaryLobs } = useLookup('/api/lookups/primary-lobs');
const { options: auditCategories } = useLookup('/api/lookups/audit-categories');
const { options: salesReportGroups } = useLookup('/api/lookups/sales-report-groups');
const { options: salesReportCategories } = useLookup('/api/lookups/sales-report-categories');

function bindSelect(baseKey, options) {
  const codeKey = `${baseKey}Code`;
  const labelKey = baseKey;
  return {
    value: form[codeKey] ?? '',
    onChange: (e) => {
      const v = e.target.value;
      update(codeKey, v);
      const o = options.find((x) => x.value === v);
      update(labelKey, o?.label ?? '');
    },
  };
}


  return (
    <div className="max-w-screen-xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-4">
          <LabeledInput
            label="Product For Sale:"
            value={form.code ?? ''}
            onChange={(v) => update('productForSale', v)}
          />
          <LabeledInput
            label="Description:"
            value={form.description ?? ''}
            onChange={(v) => update('description', v)}
          />
          <LabeledInput
            label="Display Order:"
            value={form.displayOrder ?? ''}
            onChange={(v) => update('displayOrder', v)}
          />
          <LabeledSelect
            label="Display Category"
            options={displayCategories} {...bindSelect('displayCategory', displayCategories)} />

          <LabeledInput
            label="Max Quantity:"
            value={form.maxQuantity ?? ''}
            onChange={(v) => update('maxQuantity', v)}
          />
          <LabeledSelect
            label="Primary LOB:"
            options={primaryLobs} {...bindSelect('primaryLob', primaryLobs)} />

          <LabeledSelect
            label="Audit Category:"
            options={auditCategories} {...bindSelect('auditCategory', auditCategories)} />
          
          <LabeledInput
            label="Receipt Label:"
            value={form.receiptLabel ?? ''}
            onChange={(v) => update('receiptLabel', v)}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Flags in 3 columns */}
          <div className="grid grid-cols-3 gap-4">
            <CheckRow
              label="Active"
              checked={form.generalFlags?.active ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, active: v })}
            />
            <CheckRow
              label="Display"
              checked={form.generalFlags?.display ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, display: v })}
            />
            <CheckRow
              label="Commission"
              checked={form.generalFlags?.commission ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, commission: v })}
            />
            <CheckRow
              label="Identify Customer"
              checked={form.generalFlags?.identifyCustomer ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, identifyCustomer: v })}
            />
            <CheckRow
              label="Hide Receipt Price"
              checked={form.generalFlags?.hideReceiptPrice ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, hideReceiptPrice: v })}
            />
            <CheckRow
              label="Price By Location"
              checked={form.generalFlags?.priceByLocation ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, priceByLocation: v })}
            />
            <CheckRow
              label="Price By Season"
              checked={form.generalFlags?.priceBySeason ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, priceBySeason: v })}
            />
            <CheckRow
              label="Price By Pricing Rule"
              checked={form.generalFlags?.priceByPricingRule ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, priceByPricingRule: v })}
            />
            <CheckRow
              label="Price By Sales Channel"
              checked={form.generalFlags?.priceBySalesChannel ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, priceBySalesChannel: v })}
            />
            <CheckRow
              label="Payment Profile Required"
              checked={form.generalFlags?.paymentProfileRequired ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, paymentProfileRequired: v })}
            />
            <CheckRow
              label="Eligible For Auto Renew"
              checked={form.generalFlags?.eligibleForAutoRenew ?? false}
              onChange={(v) => update('generalFlags', { ...form.generalFlags, eligibleForAutoRenew: v })}
            />
          </div>

          <LabeledSelect
            label="Sales Report Group:"
            options={salesReportGroups} {...bindSelect('salesReportGroup', salesReportGroups)} />

          <LabeledSelect
            label="Sales Report Category:"
            options={salesReportCategories} {...bindSelect('salesReportCategory', salesReportCategories)} />


          <div className="grid grid-cols-2 gap-4">
            <LabeledInput
              label="Price Change Level:"
              value={form.priceChangeLevel ?? ''}
              onChange={(v) => update('priceChangeLevel', v)}
            />
            <LabeledInput
              label="Display Level:"
              value={form.displayLevel ?? ''}
              onChange={(v) => update('displayLevel', v)}
            />
          </div>

          <LabeledInput
            label="Validate Customer SP:"
            value={form.validateCustomerSP ?? ''}
            onChange={(v) => update('validateCustomerSP', v)}
          />

          <div className="grid grid-cols-2 gap-4">
            <LabeledInput
              label="Customer Age Min:"
              type="number"
              value={form.customerAgeMin ?? ''}
              onChange={(v) => update('customerAgeMin', v === '' ? '' : Number(v))}
            />
            <LabeledInput
              label="Customer Age Max:"
              type="number"
              value={form.customerAgeMax ?? ''}
              onChange={(v) => update('customerAgeMax', v === '' ? '' : Number(v))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LabeledInput
              label="Operator ID:"
              value={form.operatorId ?? ''}
              onChange={(v) => update('operatorId', v)}
            />
            <LabeledDateInput
              label="Update Date:"
              value={form.updateDate ?? ''}
              onChange={(v) => update('updateDate', v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
