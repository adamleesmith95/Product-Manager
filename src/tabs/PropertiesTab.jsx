import React from 'react';
import Section from '../components/Section';
import Field from '../components/Field';
import TextInput from '../components/TextInput';
import NumberInput from '../components/NumberInput';
import Checkbox from '../components/Checkbox';
import TextArea from '../components/TextArea';

export default function PropertiesTab({ form, update }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Section title="Mt Money">
        <div className="grid grid-cols-2 gap-y-2">
          <Checkbox label="Pass Comp" checked={form.passComp} onChange={(v) => update('passComp', v)} />
          <Checkbox label="Ticket Comp" checked={form.ticketComp} onChange={(v) => update('ticketComp', v)} />
          <Checkbox label="Product Comp" checked={form.productComp} onChange={(v) => update('productComp', v)} />
          <Checkbox label="Pass Trade" checked={form.passTrade} onChange={(v) => update('passTrade', v)} />
          <Checkbox label="Ticket Trade" checked={form.ticketTrade} onChange={(v) => update('ticketTrade', v)} />
          <Checkbox label="Product Trade" checked={form.productTrade} onChange={(v) => update('productTrade', v)} />
          <Checkbox label="Coupon" checked={form.coupon} onChange={(v) => update('coupon', v)} />
        </div>
      </Section>

      <Section title="Order">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Checkbox label="Deposit Required" checked={form.depositRequired} onChange={(v) => update('depositRequired', v)} />
          <Checkbox label="Allow Delivery" checked={form.allowDelivery} onChange={(v) => update('allowDelivery', v)} />
          <Field label="Pickup Location Type">
            <TextInput value={form.pickupLocationType} onChange={(v) => update('pickupLocationType', v)} />
          </Field>
        </div>
      </Section>

      <Section className="lg:col-span-2" title="Internet">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Shipping Category">
            <TextInput value={form.shippingCategory} onChange={(v) => update('shippingCategory', v)} />
          </Field>
          <Field label="More Info URL">
            <TextInput value={form.moreInfoUrl} onChange={(v) => update('moreInfoUrl', v)} />
          </Field>
          <Field label="Image URL">
            <TextInput value={form.imageURL} onChange={(v) => update('imageURL', v)} />
          </Field>
          <Field label="Image Height">
            <NumberInput value={form.imageHeight} onChange={(v) => update('imageHeight', v === '' ? '' : Number(v))} />
          </Field>
          <Field label="Image Width">
            <NumberInput value={form.imageWidth} onChange={(v) => update('imageWidth', v === '' ? '' : Number(v))} />
          </Field>
          <Field label="Advance Days">
            <NumberInput value={form.advanceDays} onChange={(v) => update('advanceDays', v === '' ? '' : Number(v))} />
          </Field>
          <Field label="Units">
            <NumberInput value={form.units} onChange={(v) => update('units', v === '' ? '' : Number(v))} />
          </Field>
          <Field label="Product Unit UOM">
            <TextInput value={form.productUnitUOM} onChange={(v) => update('productUnitUOM', v)} />
          </Field>
          <Checkbox label="Featured Product" checked={form.featured} onChange={(v) => update('featured', v)} />
          <Field label="Internet Authorization">
            <TextInput value={form.internetAuthorization} onChange={(v) => update('internetAuthorization', v)} />
          </Field>
          <Field label="Special Start Date">
            <TextInput value={form.specialStartDate} onChange={(v) => update('specialStartDate', v)} />
          </Field>
          <Field label="Special End Date">
            <TextInput value={form.specialEndDate} onChange={(v) => update('specialEndDate', v)} />
          </Field>
          <Field label="Special Text">
            <TextArea rows={3} value={form.specialText} onChange={(v) => update('specialText', v)} />
          </Field>
          <Field label="Advance Purchase Day Range (Min)">
            <NumberInput value={form.advanceDayRangeMin} onChange={(v) => update('advanceDayRangeMin', v === '' ? '' : Number(v))} />
          </Field>
          <Field label="Advance Purchase Day Range (Max)">
            <NumberInput value={form.advanceDayRangeMax} onChange={(v) => update('advanceDayRangeMax', v === '' ? '' : Number(v))} />
          </Field>
        </div>
      </Section>
    </div>
  );
}