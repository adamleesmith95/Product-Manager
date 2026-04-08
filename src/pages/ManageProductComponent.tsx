import React, { useState, useEffect } from 'react';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import ProductComponentSearch from '../components/ProductComponentSearch';
import ProductComponentInlinePanel from '../components/ProductComponentInlinePanel';
import '../styles/pc-inline-preview.css';

import Modal from '../components/Modal';
import PC_GeneralTab from '../tabs/productTables/productComponents/PC_GeneralTab';
import PC_AdditionalTab from '../tabs/productTables/productComponents/PC_AdditionalTab';
import PC_ProfileTab from '../tabs/productTables/productComponents/PC_ProfileTab';
import ModalTabButton from '../components/shared/ModalTabButton';
import { useLocation } from 'react-router-dom';

export default function ManageProductComponent() {
  const [selectedProductCode, setSelectedProductCode] = useState<number | null>(null);

  const [detail, setDetail] = useState({
    open: false,
    productCode: null as number | null,
    productDescription: '',
  });
  const [activeTab, setActiveTab] = useState('general');

  const EMPTY = {
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

  const [form, setForm] = useState(EMPTY);

  // inside the component:
const location = useLocation();
const [componentAnchorCode, setComponentAnchorCode] = useState<string>('');

useEffect(() => {
  const qs = new URLSearchParams(location.search);
  const code = qs.get('focusComponentCode') ?? '';
  if (code) setComponentAnchorCode(code);
}, [location.search]);

  function update(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!detail.productCode) return;
    fetch(`/api/product-components/${detail.productCode}/general`)
      .then(res => res.json())
      .then(json => {
        const row = json?.row ?? {};
        setForm({
          ...EMPTY,
          ...row,
          active: row.active === 'Y',
          display: row.display === 'Y',
          changeRevenueLocation: row.changeRevenueLocation === 'Y',
          crmEvent: row.crmEvent === 'Y',
          onlineHotlist: row.onlineHotlist === 'Y',
          reportRevenue: row.reportRevenue === 'Y',
          printAcademyLabels: row.printAcademyLabels === 'Y',
          offlineFreeSell: row.offlineFreeSell === 'Y',
        });
      });
  }, [detail.productCode]);

  const handleSelectProduct = (row: any) => {
    const code = Number(row?.code ?? row?.productCode);
    setSelectedProductCode(Number.isFinite(code) ? code : null);
  };

  const handleOpenProduct = (row: any) => {
    const code = Number(row?.code ?? row?.productCode);
    const description = String(row?.description ?? row?.label ?? row?.name ?? '');

    setActiveTab('general'); // force default tab on every open

    setDetail({
      open: true,
      productCode: Number.isFinite(code) ? code : null,
      productDescription: description,
    });
  };

  const handleClose = () => setDetail(s => ({ ...s, open: false }));

  return (
    <>
      <ModalSessionProvider>
        <ProductComponentSearch
          onSelectProduct={handleSelectProduct}
          onOpenProduct={handleOpenProduct}
          componentAnchorCode={componentAnchorCode}   // <-- add this
          inlineDetailPanel={
            <ProductComponentInlinePanel productCode={selectedProductCode} />
          }
        />
      </ModalSessionProvider>

      {/* Modal — opens on double-click */}
      <Modal
        open={detail.open}
        onClose={handleClose}
        title={
          detail.productCode != null
            ? `Manage Product Component — ${detail.productDescription || 'Product Component'} (${detail.productCode})`
            : 'Manage Product Component'
        }
        headerClassName="pcphc-modal-header"
        titleClassName="pcphc-modal-title"
        panelClassName="pcphc-modal-panel"
      >
        <ModalSessionProvider>
          <div className="pm-tab-host">
            <div className="pm-tabs-row">
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
            </div>
            <div className="pm-tab-body pm-form-shell">
              {activeTab === 'general' && (
                <PC_GeneralTab
                  productCode={detail.productCode}
                  isActive={activeTab === 'general'}
                  form={form}
                  update={update}
                />
              )}
              {activeTab === 'additional' && (
                <PC_AdditionalTab
                  productCode={detail.productCode}
                  isActive={activeTab === 'additional'}
                  form={form}
                  update={update}
                />
              )}
              {activeTab === 'profile' && (
                <PC_ProfileTab
                  productCode={detail.productCode}
                  isActive={activeTab === 'profile'}
                  form={form}
                  update={update}
                />
              )}
            </div>
          </div>
        </ModalSessionProvider>
      </Modal>
    </>
  );
}
