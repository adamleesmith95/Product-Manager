
import React, { useEffect, useState } from 'react';
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

export default function ManageProductsForSale({ product, onClose }) {
  const [form, setForm] = useState({});
  const [topTab, setTopTab] = useState('General');
  const [bottomTab, setBottomTab] = useState('Sale Locations');

  
function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        'box-border rounded-md px-4 py-2 text-sm font-medium transition ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ' +
        (active
          ? 'bg-indigo-300 text-indigo-950 border-2 border-indigo-950'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200')
      }
    >
      {children}
    </button>
  );
}


  // NEW: which section's content is visible (single content region)
  const [section, setSection] = useState('primary'); // 'primary' | 'module'

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
    if (product) {
      hydrateForm(product);
    }
  }, [product]);

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

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    <div className="p-4 space-y-4">
      
          <div role="tablist">
        {/* Top Tabs */}
        <div className="flex space-x-2">
          {topTabs.map((tab) => {
            const isActive = topTab === tab && section === 'primary';

            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setSection('primary');
                  setTopTab(tab);
                }}
                className="
                  px-4 py-2 text-sm font-normal transition
                  border border-transparent
                  text-neutral-950
                  bg-transparent
                  hover:bg-neutral-200
                  focus:outline-none
                  aria-selected:bg-neutral-100
                  aria-selected:shadow-md
                  aria-selected:text-neutral-950
                  aria-selected:font-bold
                  focus:bg-neutral-200
                "
              >
                {tab}
              </button>
            );
          })}
        </div>


                
        {/* Bottom Tabs */}
        <div className="flex space-x-2 pt-2">
          {bottomTabs.map((tab) => {
            const isActive = bottomTab === tab && section === 'module';

            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setSection('module');
                  setBottomTab(tab);
                }}
                className="
                  px-4 py-2 text-sm font-normal transition
                  border border-transparent
                  text-neutral-950
                  bg-transparent
                  hover:bg-neutral-200
                  focus:outline-none
                  aria-selected:bg-neutral-200
                  aria-selected:shadow-md
                  aria-selected:text-neutral-950
                  aria-selected:font-bold
                  focus:bg-neutral-300
                  
                  "
              >{tab}
              </button>
            );
          })}
        </div>
</div>         
      {/* 🔸 Single Content Area (switches by section) */}
      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
        {section === 'primary' ? (
          <>
            {topTab === 'General' && <GeneralTab form={form} update={update} />}
            {topTab === 'Properties' && <PropertiesTab form={form} update={update} />}
            {topTab === 'Linked Products' && <LinkedProductsTab form={form} update={update} />}
            {topTab === 'Comments' && <CommentsTab form={form} update={update} />}
          </>
        ) : (
          <>
            {bottomTab === 'Sale Locations' && (
              <SaleLocationsTab
                form={form}
                update={update}
                productPhc={phc}        // safe to pass; component can ignore if unused
              />
            )}
            {bottomTab === 'Product Components' && (
              <ProductComponentsTab
                productPhc={phc}        // ✅ critical: fixes "no productPhc; skipping assigned fetch"
                onComponentsChanged={() => {
                  // later: notify Accounting to refresh required rows
                }}
              />
            )}
            {bottomTab === 'Accounting' && (
              <AccountingTab
                form={form}
                update={update}
                productPhc={phc}
              />
            )}
            {bottomTab === 'Product Pricing' && (
              <ProductPricingTab
                form={form}
                update={update}
                productPhc={phc}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
