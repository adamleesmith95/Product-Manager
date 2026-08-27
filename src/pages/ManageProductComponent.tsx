import React, { useState , useEffect } from 'react';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import ProductComponentSearch from '../components/ProductComponentSearch';
import ProductComponentInlinePanel from '../components/ProductComponentInlinePanel';
import '../styles/pc-inline-preview.css';

import Modal from '../components/Modal';
import PC_GeneralTab from '../tabs/productTables/productComponents/PC_GeneralTab';
import PC_AdditionalTab from '../tabs/productTables/productComponents/PC_AdditionalTab';
import ModalTabButton from '../components/shared/ModalTabButton';



export default function ManageProductComponent() {
  const USE_INLINE_PREVIEW = true;
  const [selectedProductCode, setSelectedProductCode] = useState<number | null>(null);

  // State for modal detail
  const [detail, setDetail] = useState({
    open: false,
    productCode: null,
    productDescription: '',
  });
  const [activeTab, setActiveTab] = useState('general');

  // Form state and update function
    const EMPTY = {
    // General tab fields
    productCode: null,
    description: '',
    productCategoryCode: '', productCategory: '',
    displayOrder: null,
    productProfileTypeCode: '', productProfileType: '',
    units: '',
    salesUnits: '',
    paymentDate: null,
    reference: '',
    deferralPatternCode: '', deferralPattern: '',
    operatorId: '',
    updateDate: null,
    active: false,
    display: false,
    changeRevenueLocation: false,

    // Additional tab fields
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
    crmEvent: false,
    onlineHotlist: false,
    reportRevenue: false,
    printAcademyLabels: false,
    offlineFreeSell: false,
  };

  const [form, setForm] = useState(EMPTY);

  function update(key, value) {
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

  const handleOpenProduct = (row: any) => {
    const code = Number(row?.code ?? row?.productCode);
    const description = String(
      row?.description ?? row?.productDescription ?? row?.label ?? row?.name ?? ''
    );
    setDetail({
      open: true,
      productCode: Number.isFinite(code) ? code : null,
      productDescription: description,
    });
  };

  const handleClose = () => setDetail((s) => ({ ...s, open: false }));

  return (
    <div className="h-full min-w-0">
      {USE_INLINE_PREVIEW && (
        <ModalSessionProvider>
          <ProductComponentSearch
            onSelectProduct={(row: any) =>
              setSelectedProductCode(Number(row?.code ?? row?.productCode) || null)
            }
            onOpenProduct={(row: any) => handleOpenProduct(row)}
            inlineDetailPanel={<ProductComponentInlinePanel productCode={selectedProductCode} />}
          />
        </ModalSessionProvider>
      )}

      <Modal
        open={detail.open}
        onClose={handleClose}
        title={
          detail.productCode != null
            ? `Manage Product Component — ${(detail.productDescription || 'Product Component')} (${detail.productCode})`
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
            </div>
          </div>
        </ModalSessionProvider>
      </Modal>
    </div>
  );
}

// ── Reusable browser ───────────────────────────────────────────────────────────
// Embed this inside a BrowserModal or any context that needs the PC browser
// without the full page chrome.
export function ProductComponentBrowser({ initialFocusCode = '' }: { initialFocusCode?: string }) {
  const [selectedProductCode, setSelectedProductCode] = React.useState<number | null>(null);
  const [detail, setDetail] = React.useState({
    open: false,
    productCode: null as number | null,
    productDescription: '',
  });
  const [activeTab, setActiveTab] = React.useState('general');
  const [form, setForm] = React.useState<Record<string, any>>({});

  const handleSelectProduct = (row: any) => {
    const code = Number(row?.code ?? row?.productCode);
    setSelectedProductCode(Number.isFinite(code) ? code : null);
  };

  const handleOpenProduct = (row: any) => {
    const code = Number(row?.code ?? row?.productCode);
    const description = String(row?.description ?? row?.label ?? row?.name ?? '');
    setActiveTab('general');
    setDetail({ open: true, productCode: Number.isFinite(code) ? code : null, productDescription: description });
  };

  const handleClose = () => setDetail(s => ({ ...s, open: false }));

  function update(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <ModalSessionProvider>
        <ProductComponentSearch
          onSelectProduct={handleSelectProduct}
          onOpenProduct={handleOpenProduct}
          componentAnchorCode={initialFocusCode}
          inlineDetailPanel={<ProductComponentInlinePanel productCode={selectedProductCode} />}
        />
      </ModalSessionProvider>

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
              <ModalTabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')}>General</ModalTabButton>
              <ModalTabButton active={activeTab === 'additional'} onClick={() => setActiveTab('additional')}>Additional</ModalTabButton>
            </div>
            <div className="pm-tab-body pm-form-shell">
              {activeTab === 'general' && (
                <PC_GeneralTab productCode={detail.productCode} isActive form={form} update={update} />
              )}
              {activeTab === 'additional' && (
                <PC_AdditionalTab productCode={detail.productCode} isActive form={form} update={update} />
              )}
            </div>
          </div>
        </ModalSessionProvider>
      </Modal>
    </>
  );
}