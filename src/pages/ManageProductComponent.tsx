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
  //General tab fields
  productCode: null,
  description: '',
  productCategory: '',
  displayOrder: null,
  productProfileType: '',
  units: '',
  salesUnits: '',
  paymentDate: null,
  reference: '',
  deferralPattern: '',
  operatorId: '',
  updateDate: null,

  //additional tab fields
  crmEvent: false,
  onlineHotlist: false,
  reportRevenue: false,
  printAcademyLabels: false,
  offlineFreeSell: false,

//    generalFlags: {
      //General tab flags
  //    active: false,
    //  display: false,
      //changeRevenueLocation: false,

      //Additional tab flags
    //crmEvent: false,
//    onlineHotlist: false,
  //  reportRevenue: false,
//    printAcademyLabels: false,
  //  offlineFreeSell: false

    // Add more flags as needed
    //},
  // ...other fields

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
    <div className="w-full min-w-0 overflow-hidden">
      {USE_INLINE_PREVIEW && (
        <div className="bg-white shadow-md rounded-md border border-gray-300 min-h-0">
          {/* Header bar */}
          <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
            <h2 className="text-white text-lg font-semibold">Product Component Search</h2>
          </div>

          <ProductComponentSearch
            onSelectProduct={(row: any) =>
              setSelectedProductCode(Number(row?.code ?? row?.productCode) || null)
            }
            onOpenProduct={(row: any) => handleOpenProduct(row)}
            inlineDetailPanel={<ProductComponentInlinePanel productCode={selectedProductCode} />}
          />
        </div>
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