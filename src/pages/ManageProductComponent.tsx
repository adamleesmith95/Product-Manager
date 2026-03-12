import React, { useState } from 'react';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import ProductComponentSearch from '../components/ProductComponentSearch';
import ProductComponentInlinePanel from '../components/ProductComponentInlinePanel';
import '../styles/pc-inline-preview.css';

import Modal from '../components/Modal';
import PC_GeneralTab from '../tabs/PC_GeneralTab';
import PC_AdditionalTab from '../tabs/PC_AdditionalTab';
import ModalTabButton from '../components/shared/ModalTabButton';

export default function ManageProductComponent() {
  const USE_INLINE_PREVIEW = true;
  const [selectedProductCode, setSelectedProductCode] = useState<number | null>(null);

  type ProductComponentDetailState = {
    open: boolean;
    productCode: number | null;
    productDescription: string;
  };

  const [detail, setDetail] = useState<ProductComponentDetailState>({
    open: false,
    productCode: null,
    productDescription: '',
  });
  const [activeTab, setActiveTab] = useState<'general' | 'additional'>('general');

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
              {activeTab === 'general' && <PC_GeneralTab productCode={detail.productCode} isActive />}
              {activeTab === 'additional' && <PC_AdditionalTab productCode={detail.productCode} isActive />}
            </div>
          </div>
        </ModalSessionProvider>
      </Modal>
    </div>
  );
}