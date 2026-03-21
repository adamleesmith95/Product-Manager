import React, { useEffect, useState } from 'react';
import { useModalSession } from './context/ModalSessionContext';
import ModalTabButton from './components/shared/ModalTabButton';

// Modularized tab views
import GeneralTab from './tabs/productTables/productsForSale/GeneralTab';
import PropertiesTab from './tabs/productTables/productsForSale/PropertiesTab.jsx';
import LinkedProductsTab from './tabs/productTables/productsForSale/LinkedProductsTab';
import CommentsTab from './tabs/productTables/productsForSale/CommentsTab';
import SaleLocationsTab from './tabs/productTables/productsForSale/SaleLocationsTab';
import ProductComponentsTab from './tabs/productTables/productsForSale/ProductComponentsTab';
import AccountingTab from './tabs/productTables/productsForSale/AccountingTab';
import ProductPricingTab from './tabs/productTables/productsForSale/ProductPricingTab';

const topTabs = ['General', 'Locations' , 'Components', 'Accounting' , 'Pricing' , 'Prompts' , 
  'Properties', 'LinkedPHC', 'Comments' , 'AutoRenew' , 'Grouping' , 'Modules', //'AutoApplied' , 
  'Attributes'];


//const topTabs = ['General', 'Sale Locations' , 'Product Components', 'Accounting' , 'Product Pricing' , 'Prompts' ,  'Properties',
//  'Linked Products', 'Comments' , 'Auto-Renew' , 'Display Category Grouping' , 'Sales Modules', //'Auto Applied' ,
//   'Attributes'];

function initFormFromProduct(product) {
  const S = (v) => v ?? '';
  const N = (v) => v ?? '';
  const Y = (v) => v === 'Y';

  return {
    // General
    code:                    S(product?.code),
    description:             S(product?.description),
    displayOrder:            N(product?.displayOrder),
    maxQuantity:             N(product?.maxQuantity),
    receiptLabel:            S(product?.receiptLabel),
    operatorId:              S(product?.operatorId),
    updateDate:              S(product?.updateDate),
    priceChangeLevel:        S(product?.priceChangeLevel),
    securityLevel:           S(product?.securityLevel),
    validateCustomerSP:      S(product?.validateCustomerSp ?? product?.validateCustomerSP),
    customerAgeMin:          N(product?.customerAgeMin),
    customerAgeMax:          N(product?.customerAgeMax),
    displayLevel:            S(product?.displayLevel),

    // Selects — store both code and label
    displayCategory:         S(product?.displayCategory),
    displayCategoryCode:     S(product?.displayCategoryCode),
    primaryLob:              S(product?.primaryLob),
    primaryLobCode:          S(product?.primaryLobCode ?? product?.lobCode),
    auditCategory:           S(product?.auditCategory),
    auditCategoryCode:       S(product?.auditCategoryCode),
    salesReportGroup:        S(product?.salesReportGroup),
    salesReportGroupCode:    S(product?.salesReportGroupCode),
    salesReportCategory:     S(product?.salesReportCategory),
    salesReportCategoryCode: S(product?.salesReportCategoryCode),

    generalFlags: {
      active:                 Y(product?.active),
      display:                Y(product?.display),
      commission:             Y(product?.commission),
      identifyCustomer:       Y(product?.identifyCustomer),
      hideReceiptPrice:       Y(product?.hideReceiptPrice),
      priceByLocation:        Y(product?.priceByLocation),
      priceBySeason:          Y(product?.priceBySeason),
      priceByPricingRule:     Y(product?.priceByPricingRule),
      priceBySalesChannel:    Y(product?.priceBySalesChannel),
      paymentProfileRequired: Y(product?.paymentProfileRequired),
      eligibleForAutoRenew:   Y(product?.autoRenew),
    },

    // PropertiesTab — Mt Money
    passComp:            product?.passComp    ?? false,
    ticketComp:          product?.ticketComp  ?? false,
    productComp:         product?.productComp ?? false,
    passTrade:           product?.passTrade   ?? false,
    ticketTrade:         product?.ticketTrade ?? false,
    productTrade:        product?.productTrade ?? false,
    coupon:              product?.coupon      ?? false,

    // PropertiesTab — Order
    depositRequired:     product?.depositRequired ?? false,
    allowDelivery:       product?.allowDelivery   ?? false,
    pickupLocationType:  S(product?.pickupLocationType),

    // PropertiesTab — Internet
    shippingCategory:      S(product?.shippingCategory),
    moreInfoUrl:           S(product?.moreInfoUrl),
    imageURL:              S(product?.imageURL),
    imageHeight:           N(product?.imageHeight),
    imageWidth:            N(product?.imageWidth),
    advanceDays:           N(product?.advanceDays),
    units:                 N(product?.units),
    productUnitUOM:        S(product?.productUnitUOM),
    featured:              product?.featured ?? false,
    internetAuthorization: S(product?.internetAuthorization),
    specialStartDate:      S(product?.specialStartDate),
    specialEndDate:        S(product?.specialEndDate),
    specialText:           S(product?.specialText),
    advanceDayRangeMin:    N(product?.advanceDayRangeMin ?? product?.minAdvanceDays),
    advanceDayRangeMax:    N(product?.advanceDayRangeMax ?? product?.maxAdvanceDays),
  };
}

export default function ManageProductsForSale({ product, onClose }) {
  const { tabForms, setTabForm, getDataCache, setDataCache } = useModalSession();

  const productKey = product?.code ?? product?.phcCode ?? '__new__';

  const [form, setForm] = useState(() => {
    const cached = tabForms['general'];
    return (cached && cached.code === productKey) ? cached : initFormFromProduct(product);
  });

  const [topTab, setTopTab]       = useState(() => tabForms['topTab']    ?? 'General');

  // Reset form when product changes
  useEffect(() => {
    const cached = tabForms['general'];
    if (!cached || cached.code !== productKey) {
      const fresh = initFormFromProduct(product);
      setForm(fresh);
      setTabForm('general', fresh);
    }
  }, [productKey]);

  // Persist active tab state
  useEffect(() => setTabForm('topTab',    topTab),    [topTab]);


    const update = (key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
      setTabForm('general', form);
    }, [form]);

  // Single declaration of hydrateForm
  function hydrateForm(row) {
    const fresh = initFormFromProduct(row);
    setForm(fresh);
    setTabForm('general', fresh);
  }

  const phc = String(
    product?.product_header_code ??
    product?.productHeaderCode ??
    product?.ProductHeaderCode ??
    product?.phcCode ??
    product?.code ??
    ''
  );

  // Prefetch product components
  useEffect(() => {
    if (!phc) return;
    const key = `product-components-${phc}`;
    if (getDataCache(key)) return;

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    fetch(`${API_BASE}/api/products/${phc}/components`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDataCache(key, data))
      .catch(() => {});
  }, [phc]);

  if (!product) {
    return (
      <div className="p-4 text-sm text-neutral-600">
        No product selected. Please return to the Display Categories view.
      </div>
    );
  }

  return (
  <div className="flex flex-col h-full min-h-0 overflow-hidden">
    <div role="tablist" className="shrink-0">
      <div className="pm-tab-row">
        {topTabs.map((tab) => (
          <ModalTabButton
            key={tab}
            active={topTab === tab}
            onClick={() => setTopTab(tab)}
          >
            {tab}
          </ModalTabButton>
        ))}
      </div>
    </div>

    <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-md shadow-sm border border-gray-200">
      <div className="h-full min-h-0 overflow-auto p-4">
        {topTab === 'General'          && <GeneralTab form={form} update={update} />}
        {topTab === 'Sale Locations'   && <SaleLocationsTab form={form} update={update} productPhc={phc} />}
        {topTab === 'Product Components' && (
          <div className="h-full min-h-0 overflow-hidden">
            <ProductComponentsTab productPhc={phc} onComponentsChanged={() => {}} />
          </div>
        )}
        {topTab === 'Accounting'       && <AccountingTab form={form} update={update} productPhc={phc} />}
        {topTab === 'Product Pricing'  && <ProductPricingTab form={form} update={update} productPhc={phc} />}
        {topTab === 'Properties'       && <PropertiesTab form={form} update={update} />}
        {topTab === 'Linked Products'  && <LinkedProductsTab form={form} update={update} />}
        {topTab === 'Comments'         && <CommentsTab form={form} update={update} />}
        {topTab === 'Prompts'          && <div className="p-3 text-sm text-gray-500">Prompts — coming soon.</div>}
        {topTab === 'Auto-Renew'       && <div className="p-3 text-sm text-gray-500">Auto-Renew — coming soon.</div>}
        {topTab === 'Display Category Grouping' && <div className="p-3 text-sm text-gray-500">Display Category Grouping — coming soon.</div>}
        {topTab === 'Sales Modules'    && <div className="p-3 text-sm text-gray-500">Sales Modules — coming soon.</div>}
        {topTab === 'Auto Applied'     && <div className="p-3 text-sm text-gray-500">Auto Applied — coming soon.</div>}
        {topTab === 'Attributes'       && <div className="p-3 text-sm text-gray-500">Attributes — coming soon.</div>}
      </div>
    </div>
  </div>
);
}
