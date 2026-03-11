import React, { useEffect, useState } from 'react';
import { useModalSession } from './context/ModalSessionContext';
import ModalTabButton from './components/shared/ModalTabButton';
import LabeledInput from './components/LabeledInput';
import LabeledDateInput from './components/LabeledDateInput';
import CheckRow from './components/CheckRow';

// Modularized tab views
import GeneralTab from './tabs/GeneralTab';
import PropertiesTab from './tabs/PropertiesTab.jsx';
import LinkedProductsTab from './tabs/LinkedProductsTab';
import CommentsTab from './tabs/CommentsTab';
import SaleLocationsTab from './tabs/SaleLocationsTab';
import ProductComponentsTab from './tabs/ProductComponentsTab';
import AccountingTab from './tabs/AccountingTab';
import ProductPricingTab from './tabs/ProductPricingTab';

const topTabs = ['General', 'Properties', 'Linked Products', 'Comments'];
const bottomTabs = ['Sale Locations', 'Product Components', 'Accounting', 'Product Pricing'];

// ADD
function initFormFromProduct(product) {
  return {
    code: product?.code ?? '',
    description: product?.description ?? '',
    displayOrder: product?.displayOrder ?? '',
    active: product?.active ?? '',
    display: product?.display ?? '',
    displayCategory: product?.displayCategory ?? '',
    displayCategoryCode: product?.displayCategoryCode ?? '',
    operatorId: product?.operatorId ?? '',
    updateDate: product?.updateDate ?? '',
    // ...keep/extend with any existing fields your tabs use...
  };
}

export default function ManageProductsForSale({ product, onClose }) {
  // FIX: include tabForms + setTabForm
  const { tabForms, setTabForm, getDataCache, setDataCache } = useModalSession();

  const [form, setForm] = useState(() => tabForms['general'] ?? initFormFromProduct(product));
  const [topTab, setTopTab] = useState(() => tabForms['topTab'] ?? 'General');
  const [bottomTab, setBottomTab] = useState(() => tabForms['bottomTab'] ?? 'Sale Locations');
  const [section, setSection] = useState(() => tabForms['section'] ?? 'primary');

  // keep form in sync when opening a different product
  useEffect(() => {
    if (!tabForms['general']) {
      setForm(initFormFromProduct(product));
    }
  }, [product]);

  // keep ONLY ONE update function
  const update = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      setTabForm('general', next);
      return next;
    });
  };

  // persist active tabs too
  useEffect(() => setTabForm('topTab', topTab), [topTab]);
  useEffect(() => setTabForm('bottomTab', bottomTab), [bottomTab]);

  // persist section
  useEffect(() => {
    setTabForm('section', section);
  }, [section]); // remove setTabForm from deps

  // Resolve the PHC once and pass it to tabs that need it
  const phc =
    String(
      product?.product_header_code ??
      product?.productHeaderCode ??
      product?.ProductHeaderCode ??
      product?.phcCode ??
      product?.code ??
      ''
    );

  useEffect(() => {
    const phc = product?.code ?? product?.phcCode;
    if (!phc) return;

    const key = `product-components-${phc}`;
    if (getDataCache(key)) return; // already cached

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    fetch(`${API_BASE}/api/products/${phc}/components`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDataCache(key, data))
      .catch(() => {});
  }, [product?.code, product?.phcCode, getDataCache, setDataCache]);

  function hydrateForm(row) {
    const S = (v) => v ?? '';
    const N = (v) => v ?? '';
    const Y = (v) => v === 'Y';

    setForm({
      ...row,
      productForSale: S(row.code),
      description: S(row.description),
      displayOrder: N(row.displayOrder),

      displayCategory: row.displayCategory ?? '',
      displayCategoryCode: row.displayCategoryCode ?? '',

      maxQuantity: N(row.maxQuantity),

      primaryLob: row.primaryLob ?? '',
      primaryLobCode: row.primaryLobCode ?? '',

      auditCategory: row.auditCategory ?? '',
      auditCategoryCode: row.auditCategoryCode ?? '',
      salesReportGroup: row.salesReportGroup ?? '',
      salesReportGroupCode: row.salesReportGroupCode ?? '',
      salesReportCategory: row.salesReportCategory ?? '',
      salesReportCategoryCode: row.salesReportCategoryCode ?? '',

      receiptLabel: S(row.receiptLabel),
      operatorId: S(row.operatorId),
      updateDate: S(row.updateDate),
      priceChangeLevel: S(row.priceChangeLevel),
      securityLevel: S(row.securityLevel),
      validateCustomerSp: S(row.validateCustomerSp),
      customerAgeMin: N(row.customerAgeMin),
      customerAgeMax: N(row.customerAgeMax),

      // flags
      generalFlags: {
        active: Y(row.active),
        display: Y(row.display),
        commission: Y(row.commission),
        identifyCustomer: Y(row.identifyCustomer),
        hideReceiptPrice: Y(row.hideReceiptPrice),
        priceByLocation: Y(row.priceByLocation),
        priceBySeason: Y(row.priceBySeason),
        priceByPricingRule: Y(row.priceByPricingRule),
        priceBySalesChannel: Y(row.priceBySalesChannel),
        paymentProfileRequired: Y(row.paymentProfileRequired),
        eligibleForAutoRenew: Y(row.autoRenew),
      },
    });
  }

  if (!product) {
    return (
      <div className="p-4 text-sm text-neutral-600">
        No product selected. Please return to the Display Categories view.
      </div>
    );
  }

  const handleBackToCategories = () => {
    try {
      if (typeof onClose === 'function') onClose();
      setTimeout(() => {
        const fn = window && window['goBackToCategories'];
        if (typeof fn === 'function') fn();
        else window.dispatchEvent(new CustomEvent('go-back-to-categories'));
      }, 0);
    } catch (err) {
      console.error('[Detail] Back to Categories failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden p-4 gap-3">

      {/* Tab rows - fixed height, never shrink */}
      <div role="tablist" className="shrink-0">
        <div className="pm-tab-row">
          {topTabs.map((tab) => (
            <ModalTabButton
              key={tab}
              active={topTab === tab && section === 'primary'}
              onClick={() => {
                setSection('primary');
                setTopTab(tab);
              }}
            >
              {tab}
            </ModalTabButton>
          ))}
        </div>
        <div className="pm-tab-row pt-1">
          {bottomTabs.map((tab) => (
            <ModalTabButton
              key={tab}
              active={bottomTab === tab && section === 'module'}
              onClick={() => {
                setSection('module');
                setBottomTab(tab);
              }}
            >
              {tab}
            </ModalTabButton>
          ))}
        </div>
      </div>

      {/* Tab content - must flex-1 and min-h-0 to fill remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-md shadow-sm border border-gray-200">
        {section === 'primary' ? (
          <div className="h-full min-h-0 overflow-auto p-4">
            {topTab === 'General' && <GeneralTab form={form} update={update} />}
            {topTab === 'Properties' && <PropertiesTab form={form} update={update} />}
            {topTab === 'Linked Products' && <LinkedProductsTab form={form} update={update} />}
            {topTab === 'Comments' && <CommentsTab form={form} update={update} />}
          </div>
        ) : (
          <div className="h-full min-h-0 overflow-hidden">
            {bottomTab === 'Sale Locations' && (
              <div className="h-full min-h-0 overflow-auto p-4">
                <SaleLocationsTab form={form} update={update} productPhc={phc} />
              </div>
            )}
            {bottomTab === 'Product Components' && (
              <div className="h-full min-h-0 overflow-hidden p-4">
                <ProductComponentsTab
                  productPhc={phc}
                  onComponentsChanged={() => {
                    // later: notify Accounting to refresh required rows
                  }}
                />
              </div>
            )}
            {bottomTab === 'Accounting' && (
              <div className="h-full min-h-0 overflow-auto p-4">
                <AccountingTab form={form} update={update} productPhc={phc} />
              </div>
            )}
            {bottomTab === 'Product Pricing' && (
              <div className="h-full min-h-0 overflow-auto p-4">
                <ProductPricingTab form={form} update={update} productPhc={phc} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
