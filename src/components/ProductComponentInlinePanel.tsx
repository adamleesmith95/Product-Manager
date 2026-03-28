import React, { useState } from 'react';
import PC_GeneralTab from '../tabs/productTables/productComponents/PC_GeneralTab';
import PC_AdditionalTab from '../tabs/productTables/productComponents/PC_AdditionalTab';
import PC_ProfileTab from '../tabs/productTables/productComponents/PC_ProfileTab';
import PC_TaxTab from '../tabs/productTables/productComponents/PC_TaxTab';
import PC_OutputTab from '../tabs/productTables/productComponents/PC_OutputTab';
import ModalTabButton from './shared/ModalTabButton';

type TabKey = 'general' | 'additional' | 'profile' | 'tax' | 'output';

// Inline panel uses its own local form state — purely for display,
// no update propagation needed since this is a read-only preview.
const EMPTY_FORM = {
  productCode: null,
  description: '',
  productCategoryCode: '', productCategory: '',
  displayOrder: null,
  productProfileTypeCode: '', productProfileType: '',
  units: '', salesUnits: '',
  paymentDate: null, reference: '',
  deferralPatternCode: '', deferralPattern: '',
  operatorId: '', updateDate: null,
  active: false, display: false, changeRevenueLocation: false,
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
  crmEvent: false, onlineHotlist: false, reportRevenue: false,
  printAcademyLabels: false, offlineFreeSell: false,
};

export default function ProductComponentInlinePanel({
  productCode,
  className = '',
}: {
  productCode: number | null;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [form, setForm] = useState(EMPTY_FORM);

  function update(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  return (
    <section className={`pc-inline-panel ${className}`}>
      <div className="pc-inline-tabs">
        <div className="pm-tab-row">
          <ModalTabButton
            active={activeTab === 'general'}
            onClick={() => setActiveTab('general')}
          >
            General
          </ModalTabButton>
          <ModalTabButton
            active={activeTab === 'additional'}
            onClick={() => setActiveTab('additional')}
          >
            Additional
          </ModalTabButton>
          <ModalTabButton
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </ModalTabButton>
          <ModalTabButton
            active={activeTab === 'tax'}
            onClick={() => setActiveTab('tax')}
          >
            Tax
          </ModalTabButton>
          <ModalTabButton
            active={activeTab === 'output'}
            onClick={() => setActiveTab('output')}
          >
            Output
          </ModalTabButton>
        </div>
      </div>

      <div className="pc-inline-body pc-inline-compact">
        {!productCode ? (
          <div className="pc-inline-empty">Select a row to preview details.</div>
        ) : (
          <>
            {activeTab === 'general' && (
              <PC_GeneralTab
                productCode={productCode}
                isActive={activeTab === 'general'}
                form={form}
                update={update}
              />
            )}
            {activeTab === 'additional' && (
              <PC_AdditionalTab
                productCode={productCode}
                isActive={activeTab === 'additional'}
                form={form}
                update={update}
              />
            )}
            {activeTab === 'profile' && (
              <PC_ProfileTab
                productCode={productCode}
                isActive={activeTab === 'profile'}
                form={form}
                update={update}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
